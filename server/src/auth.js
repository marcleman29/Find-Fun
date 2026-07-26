import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Service-role client: full trust, server-side only, never exposed to the app.
export const supabaseAdmin =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) : null;

// Search allowance per subscription tier. 'paid' is a placeholder until
// subscription billing (RevenueCat) exists — for now it's set manually per
// user in the profiles table for testing. Free resets monthly; paid resets
// weekly (see currentPeriodStart) so one subscriber's heavy month can't
// compound into an open-ended bill the way a flat monthly cap could.
export const TIER_LIMITS = {
  free: 10,
  paid: 100,
};

export const PERIOD_LABEL = {
  free: 'month',
  paid: 'week',
};

// Free tier keys usage by calendar month; paid keys by ISO week (Monday
// start, UTC) since it resets weekly. The server decides the period here
// rather than in SQL so both tiers can share one usage_periods table/RPC.
export function currentPeriodStart(tier) {
  const now = new Date();
  if (tier === 'paid') {
    const dayIndex = (now.getUTCDay() + 6) % 7; // Monday = 0
    const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - dayIndex));
    return monday.toISOString().slice(0, 10);
  }
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-01`;
}

export function requireAuth() {
  return async (req, res, next) => {
    if (!supabaseAdmin) {
      res.status(503).json({ error: 'Auth is not configured on the server' });
      return;
    }

    const header = req.get('authorization') ?? '';
    const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
    if (!token) {
      res.status(401).json({ error: 'Missing Authorization: Bearer <token> header' });
      return;
    }

    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) {
      res.status(401).json({ error: 'Invalid or expired session' });
      return;
    }

    req.userId = data.user.id;
    next();
  };
}

export function enforceQuota() {
  return async (req, res, next) => {
    let { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('tier')
      .eq('id', req.userId)
      .single();

    if (profileError || !profile) {
      // The on_auth_user_created trigger should create this row at signup,
      // but any account that predates that trigger (or any other gap) would
      // otherwise be hard-blocked here on every request, forever. Self-heal
      // by creating a default 'free' profile instead of failing.
      const { data: created, error: createError } = await supabaseAdmin
        .from('profiles')
        .upsert({ id: req.userId, tier: 'free' }, { onConflict: 'id' })
        .select('tier')
        .single();

      if (createError || !created) {
        console.error('Could not load or create profile:', profileError, createError);
        // Postgrest/Postgres error messages describe schema/query problems
        // (missing table, permission denied, bad constraint) — never
        // secrets — safe to surface directly instead of asking for
        // Render's dashboard logs.
        const detail = createError?.message ?? profileError?.message ?? 'unknown error';
        res.status(500).json({ error: `Could not load account: ${detail}` });
        return;
      }
      profile = created;
    }

    const limit = TIER_LIMITS[profile.tier] ?? TIER_LIMITS.free;
    const periodStart = currentPeriodStart(profile.tier);

    const { data: count, error: usageError } = await supabaseAdmin.rpc('increment_usage', {
      p_user_id: req.userId,
      p_period_start: periodStart,
    });

    if (usageError) {
      console.error('Could not record usage:', usageError);
      res.status(500).json({ error: `Could not record usage: ${usageError.message}` });
      return;
    }

    if (count > limit) {
      const label = PERIOD_LABEL[profile.tier] ?? 'month';
      res.status(429).json({ error: `This ${label}'s search limit reached (${limit}) for the ${profile.tier} tier` });
      return;
    }

    next();
  };
}
