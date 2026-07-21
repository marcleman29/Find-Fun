// Uses SerpApi's Google Maps engines (not Google's own Places API):
// https://serpapi.com/google-maps-api resolves the location from free text
// via the "google_maps" engine and returns a data_id per place, then
// https://serpapi.com/google-maps-reviews-api fetches actual review text for
// a trimmed set of candidates to keep per-request cost down.
const CATEGORY_QUERIES = {
  thingsToDo: 'fun things to do',
  placesToVisit: 'top attractions and places to visit',
  placesToEat: 'best restaurants',
};

const SERPAPI_BASE_URL = 'https://serpapi.com/search.json';
const MAX_CANDIDATES_TO_ENRICH = 9;
const MAX_REVIEWS_PER_PLACE = 5;

function candidateScore(candidate) {
  const rating = candidate.rating ?? 0;
  const count = candidate.reviews ?? 0;
  return rating * Math.log10(count + 1);
}

async function searchMaps(apiKey, query) {
  const url = new URL(SERPAPI_BASE_URL);
  url.searchParams.set('engine', 'google_maps');
  url.searchParams.set('q', query);
  url.searchParams.set('api_key', apiKey);

  const response = await fetch(url);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SerpApi google_maps error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data.local_results ?? [];
}

async function fetchReviews(apiKey, dataId) {
  const url = new URL(SERPAPI_BASE_URL);
  url.searchParams.set('engine', 'google_maps_reviews');
  url.searchParams.set('data_id', dataId);
  url.searchParams.set('api_key', apiKey);

  const response = await fetch(url);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SerpApi google_maps_reviews error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data.reviews ?? [];
}

export async function fetchPlaces(apiKey, location, category) {
  const query = `${CATEGORY_QUERIES[category]} in ${location}`;
  const candidates = await searchMaps(apiKey, query);

  const topCandidates = candidates
    .filter((candidate) => candidate.data_id && candidate.title)
    .sort((a, b) => candidateScore(b) - candidateScore(a))
    .slice(0, MAX_CANDIDATES_TO_ENRICH);

  const places = await Promise.all(
    topCandidates.map(async (candidate) => {
      const reviews = await fetchReviews(apiKey, candidate.data_id).catch(() => []);
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
