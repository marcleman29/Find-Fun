import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

import { CategoryPills } from '../../components/CategoryPills';
import { LocationSearchBar } from '../../components/LocationSearchBar';
import { PlaceCard } from '../../components/PlaceCard';
import { useFavorites } from '../../contexts/FavoritesContext';
import { mockLocation, mockPlaces } from '../../data/mockPlaces';
import { getRankedPlaces } from '../../lib/aiRecommendations';
import { fetchPlaces } from '../../lib/places';
import type { PlaceCategory, RankedPlace } from '../../lib/types';

export default function SearchScreen() {
  const [locationInput, setLocationInput] = useState(mockLocation);
  const [searchedLocation, setSearchedLocation] = useState(mockLocation);
  const [category, setCategory] = useState<PlaceCategory>('thingsToDo');
  const [results, setResults] = useState<RankedPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [placesSource, setPlacesSource] = useState<'google' | 'mock'>('mock');
  const [rankingSource, setRankingSource] = useState<'qwen' | 'fallback'>('fallback');
  const { isFavorite, toggleFavorite } = useFavorites();

  // Places come from the server's Google Places-backed endpoint when it's
  // configured; if that's unavailable (no server, no API key, network error)
  // this falls back to the bundled mock dataset so search still works.
  // Ranking is a separate fallback: Qwen when available, a local heuristic
  // otherwise — independent of where the underlying places came from.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      const fetchedPlaces = await fetchPlaces(searchedLocation, category);
      const candidates = fetchedPlaces ?? mockPlaces.filter((place) => place.category === category);
      const result = await getRankedPlaces(searchedLocation, category, candidates);

      if (cancelled) return;
      setResults(result.ranked);
      setRankingSource(result.source);
      setPlacesSource(fetchedPlaces ? 'google' : 'mock');
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [category, searchedLocation]);

  return (
    <View style={styles.container}>
      <LocationSearchBar
        value={locationInput}
        onChangeText={setLocationInput}
        onSubmit={() => setSearchedLocation(locationInput)}
      />
      <Text style={styles.locationLabel}>Showing results for {searchedLocation}</Text>
      <CategoryPills selected={category} onSelect={setCategory} />
      {!loading && placesSource === 'mock' && (
        <Text style={styles.fallbackNotice}>Live place search unavailable — showing sample data</Text>
      )}
      {!loading && rankingSource === 'fallback' && (
        <Text style={styles.fallbackNotice}>AI ranking unavailable — showing basic ranking</Text>
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
          data={results}
          keyExtractor={(place) => place.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <PlaceCard place={item} isFavorite={isFavorite(item.id)} onToggleFavorite={toggleFavorite} />
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
  fallbackNotice: {
    paddingHorizontal: 16,
    paddingTop: 6,
    fontSize: 12,
    color: '#b45309',
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
