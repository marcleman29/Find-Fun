import { useMemo } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { PlaceCard } from '../../components/PlaceCard';
import { useAuth } from '../../contexts/AuthContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { mockPlaces } from '../../data/mockPlaces';
import { rankPlaces } from '../../lib/ranking';

export default function SavedScreen() {
  const { favoriteIds, isFavorite, toggleFavorite } = useFavorites();
  const { session, signOut } = useAuth();

  const savedPlaces = useMemo(() => {
    return rankPlaces(mockPlaces.filter((place) => favoriteIds.has(place.id)));
  }, [favoriteIds]);

  return (
    <View style={styles.container}>
      <View style={styles.accountRow}>
        <Text style={styles.accountEmail}>{session?.user.email}</Text>
        <TouchableOpacity onPress={signOut}>
          <Text style={styles.signOut}>Sign out</Text>
        </TouchableOpacity>
      </View>
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
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  accountEmail: {
    fontSize: 13,
    color: '#777',
    flexShrink: 1,
  },
  signOut: {
    fontSize: 13,
    fontWeight: '600',
    color: '#c0392b',
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
