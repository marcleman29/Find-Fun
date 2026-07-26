// Mirrors server/src/auth.js's TIER_LIMITS — keep in sync. Each paid
// tier's monthlySearches is sized so even a subscriber using their entire
// allowance (worst case, no cache hit) keeps SerpApi cost under ~55% of
// what they paid, guaranteeing at least a 30-40% profit margin after
// Google Play's ~15% cut. Changing a price or quota here without the
// matching change in auth.js — or without re-checking that math — erodes
// the guarantee.
export const FREE_MONTHLY_SEARCHES = 10;

export type PaidTierId = 'plus' | 'pro' | 'max';

export interface PaidTier {
  id: PaidTierId;
  name: string;
  price: string;
  monthlySearches: number;
}

export const PAID_TIERS: PaidTier[] = [
  { id: 'plus', name: 'Plus', price: '$4.99', monthlySearches: 12 },
  { id: 'pro', name: 'Pro', price: '$9.99', monthlySearches: 25 },
  { id: 'max', name: 'Max', price: '$19.99', monthlySearches: 50 },
];

export const TIER_NAMES: Record<'free' | PaidTierId, string> = {
  free: 'Free',
  plus: 'Plus',
  pro: 'Pro',
  max: 'Max',
};

// Shared across every paid tier — they differ by price/quota, not by which
// features are unlocked.
export const PAID_FEATURES = [
  'AI-curated rankings from real review signal, not just star average',
  'Directly funds new cities, categories, and features',
];

// Real features, not live yet — shown as roadmap, not sold as active perks.
export const PLUS_COMING_SOON = ['Favorites synced to your account across devices', 'Weekly curated picks for your saved cities'];
