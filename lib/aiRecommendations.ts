import { rankPlaces } from './ranking';
import { supabase } from './supabase';
import type { Place, PlaceCategory, RankedPlace } from './types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';
const REQUEST_TIMEOUT_MS = 10000;

interface QwenRecommendation {
  id: string;
  score: number;
  highlight?: string;
}

export interface RankingResult {
  ranked: RankedPlace[];
  source: 'qwen' | 'fallback';
}

/**
 * Ranks places using the Qwen-backed /api/recommendations endpoint, which
 * scores genuine review signal rather than raw star average. Falls back to
 * the local heuristic in ranking.ts if the server or model is unavailable,
 * so the app stays usable without a Qwen API key configured.
 */
export async function getRankedPlaces(
  location: string,
  category: PlaceCategory,
  places: Place[]
): Promise<RankingResult> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const response = await fetch(`${API_BASE_URL}/api/recommendations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({ location, category, places }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!response.ok) {
      throw new Error(`Recommendations request failed with status ${response.status}`);
    }

    const data: { recommendations: QwenRecommendation[] } = await response.json();
    const byId = new Map(places.map((place) => [place.id, place]));

    const ranked = data.recommendations
      .map((rec): RankedPlace | null => {
        const place = byId.get(rec.id);
        if (!place) return null;
        return { ...place, qualityScore: rec.score, aiHighlight: rec.highlight };
      })
      .filter((place): place is RankedPlace => place !== null)
      .sort((a, b) => b.qualityScore - a.qualityScore);

    if (ranked.length === 0) {
      throw new Error('Qwen returned no usable recommendations');
    }

    return { ranked, source: 'qwen' };
  } catch {
    return { ranked: rankPlaces(places), source: 'fallback' };
  }
}
