// Uses SerpApi's Google Maps engines (not Google's own Places API):
// https://serpapi.com/google-maps-api resolves the location from free text
// via the "google_maps" engine and returns a data_id per place, then
// https://serpapi.com/google-maps-reviews-api fetches actual review text for
// a trimmed set of candidates to keep per-request cost down.
import { BudgetExceededError, recordUsage, remainingBudget } from './costGuard.js';

const CATEGORY_QUERIES = {
  thingsToDo: 'fun things to do',
  placesToVisit: 'top attractions and places to visit',
  placesToEat: 'best restaurants',
};

const SERPAPI_BASE_URL = 'https://serpapi.com/search.json';
const MAX_CANDIDATES_TO_ENRICH = 9;
const MAX_REVIEWS_PER_PLACE = 5;
// Each uncached search burns up to 1 + MAX_CANDIDATES_TO_ENRICH SerpApi
// calls. This budget only ever throttles free tier — free is the only
// traffic with no natural cost check (anyone can sign up for free,
// unlimited times), so it's the only one that needs a shared ceiling.
// Paying customers are bounded by their own weekly quota (TIER_LIMITS.paid
// in auth.js) instead: a known, expected limit, never a shared pool that
// someone else's usage — free or paid — can exhaust out from under them.
// Sized as a modest slice of SerpApi's $25/mo Starter plan (1,000 calls);
// check your actual plan before raising it.
const SERPAPI_FREE_MONTHLY_CALL_BUDGET = Number(process.env.SERPAPI_FREE_MONTHLY_CALL_BUDGET ?? 400);

function candidateScore(candidate) {
  const rating = candidate.rating ?? 0;
  const count = candidate.reviews ?? 0;
  return rating * Math.log10(count + 1);
}

async function searchMaps(apiKey, query, coords, budgetName) {
  const url = new URL(SERPAPI_BASE_URL);
  url.searchParams.set('engine', 'google_maps');
  url.searchParams.set('q', query);
  if (coords) {
    // SerpApi's google_maps engine biases/anchors results to this point when
    // `ll` is set — used for "near me" search instead of resolving a typed
    // city name, so results are the closest, not just whatever's in the
    // named location.
    url.searchParams.set('ll', `@${coords.lat},${coords.lng},14z`);
  }
  url.searchParams.set('api_key', apiKey);

  const response = await fetch(url);
  recordUsage(budgetName, 1);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SerpApi google_maps error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data.local_results ?? [];
}

async function fetchReviews(apiKey, dataId, budgetName) {
  const url = new URL(SERPAPI_BASE_URL);
  url.searchParams.set('engine', 'google_maps_reviews');
  url.searchParams.set('data_id', dataId);
  url.searchParams.set('api_key', apiKey);

  const response = await fetch(url);
  recordUsage(budgetName, 1);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SerpApi google_maps_reviews error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data.reviews ?? [];
}

export async function fetchPlaces(apiKey, location, category, coords, tier) {
  const budgetName = tier === 'paid' ? 'serpapi_paid' : 'serpapi_free';

  // Checked once per search rather than per SerpApi call — a search already
  // in flight is allowed to finish rather than fail partway through; this
  // only blocks the *next* search once free tier's monthly budget is used
  // up. Paid is recorded (budgetName above) for visibility but never gated
  // here — see the comment on SERPAPI_FREE_MONTHLY_CALL_BUDGET for why.
  if (tier !== 'paid' && remainingBudget(budgetName, SERPAPI_FREE_MONTHLY_CALL_BUDGET) <= 0) {
    throw new BudgetExceededError('Monthly SerpApi call budget exhausted for free tier');
  }

  // With coords, `ll` already anchors the search geographically — appending
  // "in {location}" would fight that with a (often approximate) place name.
  const query = coords ? CATEGORY_QUERIES[category] : `${CATEGORY_QUERIES[category]} in ${location}`;
  const candidates = await searchMaps(apiKey, query, coords, budgetName);

  const topCandidates = candidates
    .filter((candidate) => candidate.data_id && candidate.title)
    .sort((a, b) => candidateScore(b) - candidateScore(a))
    .slice(0, MAX_CANDIDATES_TO_ENRICH);

  const places = await Promise.all(
    topCandidates.map(async (candidate) => {
      const reviews = await fetchReviews(apiKey, candidate.data_id, budgetName).catch(() => []);
      return {
        id: candidate.data_id,
        name: candidate.title,
        category,
        address: candidate.address ?? '',
        rating: candidate.rating ?? 0,
        reviewCount: candidate.reviews ?? 0,
        photoUrl: candidate.thumbnail ?? undefined,
        topReviews: reviews.slice(0, MAX_REVIEWS_PER_PLACE).map((review, index) => ({
          id: `${candidate.data_id}-review-${index}`,
          author: review.user?.name ?? 'Google user',
          rating: review.rating ?? 0,
          text: review.snippet ?? '',
          date: (review.iso_date ?? '').slice(0, 10),
        })),
      };
    })
  );

  return places;
}

export { CATEGORY_QUERIES };
