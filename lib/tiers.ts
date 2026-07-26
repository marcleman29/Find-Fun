// Free/Plus limits mirror server/src/auth.js's TIER_LIMITS — keep in sync.
// Free resets monthly; Plus resets weekly (a lower per-period ceiling), so
// one subscriber's heavy month can't compound into an open-ended bill.
export const FREE_MONTHLY_SEARCHES = 10;
export const PLUS_WEEKLY_SEARCHES = 100;

export const PLUS_FEATURES = [
  'AI-curated rankings from real review signal, not just star average',
  `${PLUS_WEEKLY_SEARCHES} searches a week instead of ${FREE_MONTHLY_SEARCHES} a month`,
  'Directly funds new cities, categories, and features',
];

// Real features, not live yet — shown as roadmap, not sold as active perks.
export const PLUS_COMING_SOON = ['Favorites synced to your account across devices', 'Weekly curated picks for your saved cities'];
