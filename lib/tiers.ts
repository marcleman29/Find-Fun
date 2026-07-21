// Free/Plus limits mirror server/src/auth.js's TIER_LIMITS — keep in sync.
export const FREE_MONTHLY_SEARCHES = 30;
export const PLUS_MONTHLY_SEARCHES = 1000;

export const PLUS_FEATURES = [
  `${PLUS_MONTHLY_SEARCHES.toLocaleString()} searches a month instead of ${FREE_MONTHLY_SEARCHES}`,
  "Never get bumped to sample data mid-trip because you hit the cap",
  'Directly funds new cities, categories, and features',
];

// Real features, not live yet — shown as roadmap, not sold as active perks.
export const PLUS_COMING_SOON = ['Favorites synced to your account across devices', 'Weekly curated picks for your saved cities'];
