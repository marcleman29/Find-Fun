// Wraps the Places API (New): https://developers.google.com/maps/documentation/places/web-service/text-search
// Text Search resolves the location from free text (no separate geocoding call
// needed), then Place Details fetches reviews for a trimmed set of candidates
// to keep per-request Places API cost down.
const CATEGORY_QUERIES = {
  thingsToDo: 'fun things to do',
  placesToVisit: 'top attractions and places to visit',
  placesToEat: 'best restaurants',
};

const SEARCH_FIELD_MASK = 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount';
const DETAILS_FIELD_MASK = 'reviews';
const MAX_CANDIDATES_TO_ENRICH = 9;

function candidateScore(candidate) {
  const rating = candidate.rating ?? 0;
  const count = candidate.userRatingCount ?? 0;
  return rating * Math.log10(count + 1);
}

async function searchTextPlaces(apiKey, query) {
  const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': SEARCH_FIELD_MASK,
    },
    body: JSON.stringify({ textQuery: query, maxResultCount: 20 }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Places text search error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data.places ?? [];
}

async function fetchPlaceReviews(apiKey, placeId) {
  const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    headers: {
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': DETAILS_FIELD_MASK,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Places details error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data.reviews ?? [];
}

export async function fetchPlaces(apiKey, location, category) {
  const query = `${CATEGORY_QUERIES[category]} in ${location}`;
  const candidates = await searchTextPlaces(apiKey, query);

  const topCandidates = candidates
    .filter((candidate) => candidate.id && candidate.displayName?.text)
    .sort((a, b) => candidateScore(b) - candidateScore(a))
    .slice(0, MAX_CANDIDATES_TO_ENRICH);

  const places = await Promise.all(
    topCandidates.map(async (candidate) => {
      const reviews = await fetchPlaceReviews(apiKey, candidate.id).catch(() => []);
      return {
        id: candidate.id,
        name: candidate.displayName.text,
        category,
        address: candidate.formattedAddress ?? '',
        rating: candidate.rating ?? 0,
        reviewCount: candidate.userRatingCount ?? 0,
        topReviews: reviews.slice(0, 5).map((review, index) => ({
          id: `${candidate.id}-review-${index}`,
          author: review.authorAttribution?.displayName ?? 'Google user',
          rating: review.rating ?? 0,
          text: review.text?.text ?? review.originalText?.text ?? '',
          date: (review.publishTime ?? '').slice(0, 10),
        })),
      };
    })
  );

  return places;
}

export { CATEGORY_QUERIES };
