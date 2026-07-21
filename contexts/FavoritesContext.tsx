import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'find-fun:favorites';

interface FavoritesContextValue {
  favoriteIds: Set<string>;
  isFavorite: (placeId: string) => boolean;
  toggleFavorite: (placeId: string) => void;
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  // Guards against the write effect firing with the initial empty Set before
  // the stored value has loaded, which would wipe out whatever was saved.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const ids: unknown = JSON.parse(raw);
          if (Array.isArray(ids)) {
            setFavoriteIds(new Set(ids));
          }
        }
      })
      .catch(() => {
        // Corrupt or unreadable storage — start from empty rather than crash.
      })
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(favoriteIds))).catch(() => {
      // Best-effort persistence — a failed write shouldn't break the UI.
    });
  }, [favoriteIds, hydrated]);

  const toggleFavorite = useCallback((placeId: string) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(placeId)) {
        next.delete(placeId);
      } else {
        next.add(placeId);
      }
      return next;
    });
  }, []);

  const isFavorite = useCallback((placeId: string) => favoriteIds.has(placeId), [favoriteIds]);

  const value = useMemo(
    () => ({ favoriteIds, isFavorite, toggleFavorite }),
    [favoriteIds, isFavorite, toggleFavorite]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
