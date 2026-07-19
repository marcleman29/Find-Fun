import { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { PlaceCard } from '../../components/PlaceCard';
import { useFavorites } from '../../contexts/FavoritesContext';
import { mockPlaces } from '../../data/mockPlaces';
import { rankPlaces } from '../../lib/ranking';

export default function SavedScreen() {
  const { favoriteIds, isFavorite, toggleFavorite } = useFavorites();

  const savedPlaces = useMemo(() => {
    return rankPlaces(mockPlaces.filter((place) => favoriteIds.has(place.id)));
  }, [favoriteIds]);

  return (
    <View style={styles.container}>
      <FlatList
        data={savedPlaces}
        keyExtractor={(place) => place.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <PlaceCard place={item} isFavorite={isFavorite(item.id)} onToggleFavorite={toggleFavorite} />
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Places you save will show up here for your trip.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7fb',
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    paddingHorizontal: 32,
    color: '#999',
  },
});
