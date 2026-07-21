import { supabase } from './supabase';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

export interface LikeInfo {
  count: number;
  likedByMe: boolean;
}

/**
 * Batch-fetches community like counts for a set of place IDs. Never throws —
 * returns an empty map on any failure so a likes outage can't break search,
 * same fail-open pattern as places/recommendations.
 */
export async function fetchLikeCounts(placeIds: string[]): Promise<Record<string, LikeInfo>> {
  if (placeIds.length === 0) return {};

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return {};

    const response = await fetch(`${API_BASE_URL}/api/likes?ids=${encodeURIComponent(placeIds.join(','))}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!response.ok) return {};

    const data: { likes: Record<string, LikeInfo> } = await response.json();
    return data.likes;
  } catch {
    return {};
  }
}

/** Toggles the current user's like on a place. Returns null on failure. */
export async function toggleLike(placeId: string): Promise<LikeInfo | null> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return null;

    const response = await fetch(`${API_BASE_URL}/api/places/${encodeURIComponent(placeId)}/like`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!response.ok) return null;

    const data: { liked: boolean; count: number } = await response.json();
    return { count: data.count, likedByMe: data.liked };
  } catch {
    return null;
  }
}
