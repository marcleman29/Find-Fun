import { supabase } from './supabase';
import type { Place, PlaceCategory } from './types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';
// The server runs on Render's free tier, which spins the instance down after
// idle and can take 30-50s to cold-start on the next request. A short
// timeout here would make every "first request after idle" silently fall
// back to mock data even though the server is healthy, just slow to wake.
const REQUEST_TIMEOUT_MS = 45000;

export type FetchFailureReason = 'auth' | 'quota' | 'server' | 'network';

export interface FetchPlacesResult {
  places: Place[] | null;
  reason: FetchFailureReason | null;
}

function reasonForStatus(status: number): FetchFailureReason {
  if (status === 401) return 'auth';
  if (status === 429) return 'quota';
  if (status >= 500) return 'server';
  return 'network';
}

/**
 * Fetches real places from the server's Google Places-backed endpoint.
 * Never throws — returns a reason (auth/quota/server/network) alongside a
 * null places list on failure, so callers can fall back to mock data while
 * still telling the user *why* instead of a single opaque "unavailable".
 */
export async function fetchPlaces(location: string, category: PlaceCategory): Promise<FetchPlacesResult> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const params = new URLSearchParams({ location, category });
    const response = await fetch(`${API_BASE_URL}/api/places?${params.toString()}`, {
      signal: controller.signal,
      headers: session ? { Authorization: `Bearer ${session.access_token}` } : undefined,
    }).finally(() => clearTimeout(timeout));

    if (!response.ok) {
      return { places: null, reason: reasonForStatus(response.status) };
    }

    const data: { places: Place[] } = await response.json();
    return data.places.length > 0 ? { places: data.places, reason: null } : { places: null, reason: null };
  } catch {
    return { places: null, reason: 'network' };
  }
}
