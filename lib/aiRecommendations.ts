import type { FetchFailureReason } from './places';
import { rankPlaces } from './ranking';
import { supabase } from './supabase';
import type { Place, PlaceCategory, RankedPlace } from './types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';
// See the matching comment in lib/places.ts — Render free-tier cold starts
// can take well past 10s, so a short timeout here defeats Qwen ranking on
// every first request after idle.
const REQUEST_TIMEOUT_MS = 45000;

interface QwenRecommendation {
  id: string;
  score: number;
  highlight?: string;
}

export interface RankingResult {
  ranked: RankedPlace[];
  source: 'qwen' | 'fallback';
  reason: FetchFailureReason | null;
  detail: string | null;
}

function reasonForStatus(status: number): FetchFailureReason {
  if (status === 401) return 'auth';
  if (status === 429) return 'quota';
  if (status >= 500) return 'server';
  return 'network';
}

// The server's error responses are short, fixed, non-secret strings (e.g.
// "Could not load account") — safe to show directly instead of a generic
// "server error" that hides which of several checks actually failed.
async function readErrorDetail(response: Response): Promise<string | null> {
  try {
    const body: { error?: string } = await response.json();
    return body.error ?? null;
  } catch {
    return null;
  }
}

/**
 * Ranks places using the Qwen-backed /api/recommendations endpoint, which
 * scores genuine review signal rather than raw star average. Falls back to
 * the local heuristic in ranking.ts if the server or model is unavailable,
 * so the app stays usable without a Qwen API key configured. The reason is
 * carried through even on fallback so the UI can say *why* instead of a
 * single opaque "unavailable".
 */
export async function getRankedPlaces(
  location: string,
  category: PlaceCategory,
  places: Place[]
): Promise<RankingResult> {
  let reason: FetchFailureReason = 'network';
  let detail: string | null = null;

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
      reason = reasonForStatus(response.status);
      detail = await readErrorDetail(response);
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
      reason = 'server';
      detail = 'Qwen returned no usable recommendations';
      throw new Error(detail);
    }

    return { ranked, source: 'qwen', reason: null, detail: null };
  } catch {
    return { ranked: rankPlaces(places), source: 'fallback', reason, detail };
  }
}
