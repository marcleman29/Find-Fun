import { supabase } from './supabase';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

export interface Account {
  tier: 'free' | 'paid';
  searchesUsed: number;
  searchLimit: number;
}

/** Fetches the current user's plan + monthly usage. Returns null on any failure. */
export async function fetchAccount(): Promise<Account | null> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return null;

    const response = await fetch(`${API_BASE_URL}/api/account`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!response.ok) return null;

    return (await response.json()) as Account;
  } catch {
    return null;
  }
}
