import type { Place, RankedPlace, ReviewSnippet } from './types';

const RECENCY_HALF_LIFE_DAYS = 365;

function daysSince(dateString: string): number {
  const ms = Date.now() - new Date(dateString).getTime();
  return ms / (1000 * 60 * 60 * 24);
}

// Newer reviews count more than old ones, decaying by half every RECENCY_HALF_LIFE_DAYS.
function recencyWeight(review: ReviewSnippet): number {
  return Math.pow(0.5, daysSince(review.date) / RECENCY_HALF_LIFE_DAYS);
}

/**
 * Star average alone rewards places with a handful of 5-star reviews as much as
 * places with hundreds. This blends recency-weighted sentiment from the visible
 * review snippets with a log-scaled review count, so depth and freshness matter
 * without letting a huge review count alone dominate.
 */
export function computeQualityScore(place: Place): number {
  const weightedReviews = place.topReviews.reduce(
    (acc, review) => {
      const weight = recencyWeight(review);
      return { sum: acc.sum + review.rating * weight, weight: acc.weight + weight };
    },
    { sum: 0, weight: 0 }
  );

  const recencyWeightedRating =
    weightedReviews.weight > 0 ? weightedReviews.sum / weightedReviews.weight : place.rating;

  const depthFactor = Math.log10(place.reviewCount + 1);

  return Math.round(recencyWeightedRating * depthFactor * 100) / 100;
}

export function rankPlaces(places: Place[]): RankedPlace[] {
  return places
    .map((place) => ({ ...place, qualityScore: computeQualityScore(place) }))
    .sort((a, b) => b.qualityScore - a.qualityScore);
}
