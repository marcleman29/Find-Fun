import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Service-role client: full trust, server-side only, never exposed to the app.
export const supabaseAdmin =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) : null;

// Monthly search allowance per subscription tier. 'paid' is a placeholder
// until subscription billing (RevenueCat) exists — for now it's set manually
// per user in the profiles table for testing.
const TIER_LIMITS = {
  free: 30,
  paid: 1000,
};

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
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('tier')
      .eq('id', req.userId)
      .single();

    if (profileError || !profile) {
      res.status(500).json({ error: 'Could not load account' });
      return;
    }

    const limit = TIER_LIMITS[profile.tier] ?? TIER_LIMITS.free;

    const { data: count, error: usageError } = await supabaseAdmin.rpc('increment_usage', {
      p_user_id: req.userId,
    });

    if (usageError) {
      res.status(500).json({ error: 'Could not record usage' });
      return;
    }

    if (count > limit) {
      res.status(429).json({ error: `Monthly search limit reached (${limit}) for the ${profile.tier} tier` });
      return;
    }

    next();
  };
}
