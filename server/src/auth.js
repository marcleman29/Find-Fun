import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Service-role client: full trust, server-side only, never exposed to the app.
export const supabaseAdmin =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) : null;

// Monthly search allowance per subscription tier. Paid tiers are a
// placeholder until subscription billing (RevenueCat) exists — for now
// tier is set manually in the profiles table for testing. Each paid tier's
// quota is sized so that even a subscriber using their *entire* monthly
// allowance (worst case, no cache hit — see MAX_CANDIDATES_TO_ENRICH in
// places.js) keeps SerpApi cost under ~55% of what they paid, guaranteeing
// at least a 30-40% profit margin after Google Play's ~15% cut. Raising a
// tier's quota without re-checking that math would erode the guarantee.
export const TIER_LIMITS = {
  free: 10,
  plus: 12,
  pro: 25,
  max: 50,
};

export function currentPeriodStart() {
  const now = new Date();
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
    const periodStart = currentPeriodStart();

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
      res.status(429).json({ error: `This month's search limit reached (${limit}) for the ${profile.tier} tier` });
      return;
    }

    req.tier = profile.tier;
    next();
  };
}
