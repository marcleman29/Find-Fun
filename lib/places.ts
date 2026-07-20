import { supabase } from './supabase';
import type { Place, PlaceCategory } from './types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';
const REQUEST_TIMEOUT_MS = 10000;

/**
 * Fetches real places from the server's Google Places-backed endpoint.
 * Returns null (rather than throwing) on any failure — missing API key,
 * network error, timeout — so callers can fall back to mock data instead
 * of breaking the search flow.
 */
export async function fetchPlaces(location: string, category: PlaceCategory): Promise<Place[] | null> {
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
      return null;
    }

    const data: { places: Place[] } = await response.json();
    return data.places.length > 0 ? data.places : null;
  } catch {
    return null;
  }
}
