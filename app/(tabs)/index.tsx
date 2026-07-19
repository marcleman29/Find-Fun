import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

import { CategoryPills } from '../../components/CategoryPills';
import { LocationSearchBar } from '../../components/LocationSearchBar';
import { PlaceCard } from '../../components/PlaceCard';
import { useFavorites } from '../../contexts/FavoritesContext';
import { mockLocation, mockPlaces } from '../../data/mockPlaces';
import { getRankedPlaces } from '../../lib/aiRecommendations';
import type { PlaceCategory, RankedPlace } from '../../lib/types';

export default function SearchScreen() {
  const [locationInput, setLocationInput] = useState(mockLocation);
  const [searchedLocation, setSearchedLocation] = useState(mockLocation);
  const [category, setCategory] = useState<PlaceCategory>('thingsToDo');
  const [results, setResults] = useState<RankedPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<'qwen' | 'fallback'>('fallback');
  const { isFavorite, toggleFavorite } = useFavorites();

  // Location search doesn't hit a real Places API yet (roadmap item 2) — every
  // search currently resolves to the same mock dataset, ranked by Qwen with a
  // local fallback if the AI ranking server is unavailable.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const candidates = mockPlaces.filter((place) => place.category === category);
    getRankedPlaces(searchedLocation, category, candidates).then((result) => {
      if (cancelled) return;
      setResults(result.ranked);
      setSource(result.source);
      setLoading(false);
    });

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
      {!loading && source === 'fallback' && (
        <Text style={styles.fallbackNotice}>AI ranking unavailable — showing basic ranking</Text>
      )}
      {loading ? (
        <ActivityIndicator style={styles.loading} size="large" color="#1a1a2e" />
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
