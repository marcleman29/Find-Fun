import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { CategoryPills } from '../../components/CategoryPills';
import { LocationSearchBar } from '../../components/LocationSearchBar';
import { PlaceCard } from '../../components/PlaceCard';
import { useFavorites } from '../../contexts/FavoritesContext';
import { mockLocation, mockPlaces } from '../../data/mockPlaces';
import { rankPlaces } from '../../lib/ranking';
import type { PlaceCategory } from '../../lib/types';

export default function SearchScreen() {
  const [locationInput, setLocationInput] = useState(mockLocation);
  const [searchedLocation, setSearchedLocation] = useState(mockLocation);
  const [category, setCategory] = useState<PlaceCategory>('thingsToDo');
  const { isFavorite, toggleFavorite } = useFavorites();

  // Location search doesn't hit a real API yet (roadmap item 2) — every search
  // currently resolves to the same mock dataset, ranked and filtered locally.
  const rankedResults = useMemo(() => {
    return rankPlaces(mockPlaces.filter((place) => place.category === category));
  }, [category]);

  return (
    <View style={styles.container}>
      <LocationSearchBar
        value={locationInput}
        onChangeText={setLocationInput}
        onSubmit={() => setSearchedLocation(locationInput)}
      />
      <Text style={styles.locationLabel}>Showing results for {searchedLocation}</Text>
      <CategoryPills selected={category} onSelect={setCategory} />
      <FlatList
        data={rankedResults}
        keyExtractor={(place) => place.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <PlaceCard place={item} isFavorite={isFavorite(item.id)} onToggleFavorite={toggleFavorite} />
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No results yet for this category.</Text>}
      />
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
  listContent: {
    paddingBottom: 24,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#999',
  },
});
