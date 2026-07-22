import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, ActivityIndicator, FlatList, LayoutAnimation, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { CategoryPills } from '../../components/CategoryPills';
import { LocationSearchBar } from '../../components/LocationSearchBar';
import { PlaceCard } from '../../components/PlaceCard';
import { PressableScale } from '../../components/PressableScale';
import { useFavorites } from '../../contexts/FavoritesContext';
import { mockLocation, mockPlaces } from '../../data/mockPlaces';
import { getRankedPlaces } from '../../lib/aiRecommendations';
import { fetchLikeCounts, type LikeInfo } from '../../lib/likes';
import { getCurrentLocation } from '../../lib/location';
import { fetchPlaces, type FetchFailureReason } from '../../lib/places';
import { rankPlaces } from '../../lib/ranking';
import type { PlaceCategory, RankedPlace } from '../../lib/types';

type SortMode = 'top' | 'trending';

const BRAND_GRADIENT: [string, string] = ['#ff0080', '#ff8c00'];

// Surfaced instead of one opaque "unavailable" message so a real cause
// (expired session, hit the monthly search cap, server error, no
// connection) is visible instead of guessing. Only used when there are no
// real places at all — a places failure and a ranking failure are shown
// with different wording (see rankingReasonMessage below) since "AI
// ranking timed out on real results" and "no real results at all" are very
// different situations and conflating them into one "sample data" message
// is actively misleading.
const REASON_MESSAGES: Record<FetchFailureReason, string> = {
  auth: 'Your session expired — sign out and back in to restore live results.',
  quota: "You've hit this month's search limit.",
  server: 'The server hit an error — showing sample data instead.',
  network: "Couldn't reach the server — showing sample data instead.",
};

function rankingReasonMessage(reason: FetchFailureReason | null): string {
  switch (reason) {
    case 'quota':
      return "AI ranking hit this month's search limit — showing these real results with basic ranking.";
    case 'auth':
      return 'Your session expired, so AI ranking was skipped — showing these real results with basic ranking.';
    default:
      return 'AI ranking unavailable right now — showing these real results with basic ranking.';
  }
}

export default function SearchScreen() {
  const [locationInput, setLocationInput] = useState(mockLocation);
  const [searchedLocation, setSearchedLocation] = useState(mockLocation);
  const [category, setCategory] = useState<PlaceCategory>('thingsToDo');
  const [results, setResults] = useState<RankedPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [placesSource, setPlacesSource] = useState<'google' | 'mock'>('mock');
  const [rankingSource, setRankingSource] = useState<'qwen' | 'fallback'>('fallback');
  const [placesFailureReason, setPlacesFailureReason] = useState<FetchFailureReason | null>(null);
  const [placesFailureDetail, setPlacesFailureDetail] = useState<string | null>(null);
  const [rankingFailureReason, setRankingFailureReason] = useState<FetchFailureReason | null>(null);
  const [rankingFailureDetail, setRankingFailureDetail] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('top');
  const [refiningRanking, setRefiningRanking] = useState(false);
  const [likeCounts, setLikeCounts] = useState<Record<string, LikeInfo>>({});
  const { isFavorite, toggleFavorite } = useFavorites();
  const lastReasonRef = useRef<FetchFailureReason | null>(null);

  // Places come from the server's Google Places-backed endpoint when it's
  // configured; if that's unavailable (no server, no API key, network error)
  // this falls back to the bundled mock dataset so search still works.
  // Ranking is a separate fallback: Qwen when available, a local heuristic
  // otherwise — independent of where the underlying places came from.
  //
  // The two calls used to be awaited back-to-back behind one spinner. Qwen
  // is a 72B-parameter model through a shared inference API — genuinely
  // slow, sometimes 10-20s+ — so that made every search feel broken even
  // though the place data itself is usually back in a couple of seconds.
  // Now: show the local-heuristic ranking the instant places arrive, then
  // swap in the AI ranking when it resolves, instead of blocking on both.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setRefiningRanking(false);

    (async () => {
      const placesResult = await fetchPlaces(searchedLocation, category, coords ?? undefined);
      if (cancelled) return;

      const candidates = placesResult.places ?? mockPlaces.filter((place) => place.category === category);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setResults(rankPlaces(candidates));
      setRankingSource('fallback');
      setPlacesSource(placesResult.places ? 'google' : 'mock');
      setPlacesFailureReason(placesResult.reason);
      setPlacesFailureDetail(placesResult.detail);
      setRankingFailureReason(null);
      setRankingFailureDetail(null);
      setLoading(false);
      setRefiningRanking(true);

      const rankingResult = await getRankedPlaces(searchedLocation, category, candidates);
      if (cancelled) return;

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setResults(rankingResult.ranked);
      setRankingSource(rankingResult.source);
      setRankingFailureReason(rankingResult.reason);
      setRankingFailureDetail(rankingResult.detail);
      setRefiningRanking(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [category, searchedLocation, coords]);

  // Only fetch like counts when Trending is actually selected — no point
  // paying that round trip for the default Top Picks view.
  useEffect(() => {
    if (sortMode !== 'trending' || results.length === 0) return;
    let cancelled = false;
    fetchLikeCounts(results.map((place) => place.id)).then((counts) => {
      if (!cancelled) setLikeCounts(counts);
    });
    return () => {
      cancelled = true;
    };
  }, [sortMode, results]);

  const displayResults =
    sortMode === 'trending'
      ? [...results].sort((a, b) => (likeCounts[b.id]?.count ?? 0) - (likeCounts[a.id]?.count ?? 0))
      : results;

  // Hitting the free cap is the single best moment to offer an upgrade —
  // the user just directly felt the limit. Fires once per new occurrence,
  // not on every re-render while it stays 'quota'. Either endpoint can hit
  // the cap (places and recommendations each count against it separately).
  const activeReason = placesFailureReason ?? rankingFailureReason;
  useEffect(() => {
    if (activeReason === 'quota' && lastReasonRef.current !== 'quota') {
      router.push('/upgrade');
    }
    lastReasonRef.current = activeReason;
  }, [activeReason]);

  const selectCategory = (next: PlaceCategory) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCategory(next);
  };

  const selectSortMode = (next: SortMode) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSortMode(next);
  };

  // A typed search always means "this named place," not "exactly where I'm
  // standing" — drop any coords from a previous near-me search so it doesn't
  // silently keep biasing results to the old GPS point.
  const submitTextSearch = () => {
    setCoords(null);
    setSearchedLocation(locationInput);
  };

  const useCurrentLocation = async () => {
    setLocating(true);
    const resolved = await getCurrentLocation();
    setLocating(false);

    if (!resolved) {
      Alert.alert(
        'Location unavailable',
        'Enable location access for Find Fun in your device settings to search near you, or type a city instead.'
      );
      return;
    }

    setCoords(resolved.coords);
    setLocationInput(resolved.label);
    setSearchedLocation(resolved.label);
  };

  return (
    <View style={styles.container}>
      <LocationSearchBar
        value={locationInput}
        onChangeText={setLocationInput}
        onSubmit={submitTextSearch}
        onUseCurrentLocation={useCurrentLocation}
        locating={locating}
      />
      <Text style={styles.locationLabel}>
        {coords ? 'Showing results near' : 'Showing results for'} {searchedLocation}
      </Text>
      <CategoryPills selected={category} onSelect={selectCategory} />

      <View style={styles.sortRow}>
        <PressableScale onPress={() => selectSortMode('top')}>
          <View style={[styles.sortPill, sortMode === 'top' && styles.sortPillActive]}>
            <Ionicons name="star" size={13} color={sortMode === 'top' ? '#fff' : '#666'} />
            <Text style={[styles.sortPillText, sortMode === 'top' && styles.sortPillTextActive]}>Top Picks</Text>
          </View>
        </PressableScale>
        <PressableScale onPress={() => selectSortMode('trending')}>
          <View style={[styles.sortPill, sortMode === 'trending' && styles.sortPillActive]}>
            <Ionicons name="flame" size={13} color={sortMode === 'trending' ? '#fff' : '#666'} />
            <Text style={[styles.sortPillText, sortMode === 'trending' && styles.sortPillTextActive]}>Trending</Text>
          </View>
        </PressableScale>
      </View>

      <TouchableOpacity onPress={() => router.push('/upgrade')} activeOpacity={0.85}>
        <LinearGradient colors={BRAND_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.promoBanner}>
          <Ionicons name="sparkles" size={16} color="#fff" />
          <Text style={styles.promoText}>Go Plus for 1,000 searches a month</Text>
          <Ionicons name="chevron-forward" size={16} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      {!loading && refiningRanking && (
        <View style={styles.refiningRow}>
          <ActivityIndicator size="small" color="#3949ab" />
          <Text style={styles.refiningText}>Refining with AI…</Text>
        </View>
      )}
      {!loading && !refiningRanking && placesSource === 'mock' && (
        <Text style={styles.fallbackNotice}>
          {placesFailureReason ? REASON_MESSAGES[placesFailureReason] : 'Live search unavailable — showing sample data'}
          {placesFailureDetail ? ` (${placesFailureDetail})` : ''}
        </Text>
      )}
      {!loading && !refiningRanking && placesSource === 'google' && rankingSource === 'fallback' && (
        <Text style={styles.fallbackNotice}>
          {rankingReasonMessage(rankingFailureReason)}
          {rankingFailureDetail ? ` (${rankingFailureDetail})` : ''}
        </Text>
      )}
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#1a1a2e" />
          <Text style={styles.loadingHint}>
            Finding the best spots — this can take up to 30s if the server is waking up.
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayResults}
          keyExtractor={(place) => place.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <PlaceCard
              place={item}
              isFavorite={isFavorite(item.id)}
              onToggleFavorite={toggleFavorite}
              likeCount={sortMode === 'trending' ? (likeCounts[item.id]?.count ?? 0) : undefined}
            />
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No results yet for this category.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7fb',
  },
  locationLabel: {
    paddingHorizontal: 16,
    paddingTop: 8,
    fontSize: 13,
    color: '#888',
  },
  sortRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  sortPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#f0f0f0',
  },
  sortPillActive: {
    backgroundColor: '#1a1a2e',
  },
  sortPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  sortPillTextActive: {
    color: '#fff',
  },
  promoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  promoText: {
    flex: 1,
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  fallbackNotice: {
    paddingHorizontal: 16,
    paddingTop: 6,
    fontSize: 12,
    color: '#b45309',
  },
  refiningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  refiningText: {
    fontSize: 12,
    color: '#3949ab',
  },
  loading: {
    marginTop: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingHint: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#999',
  },
});
