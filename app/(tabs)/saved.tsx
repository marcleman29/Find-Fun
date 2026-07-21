import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { PlaceCard } from '../../components/PlaceCard';
import { PressableScale } from '../../components/PressableScale';
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
        <Text style={styles.accountEmail} numberOfLines={1}>
          {session?.user.email}
        </Text>
        <PressableScale onPress={signOut}>
          <View style={styles.signOutButton}>
            <Ionicons name="log-out-outline" size={16} color="#c0392b" />
            <Text style={styles.signOut}>Sign out</Text>
          </View>
        </PressableScale>
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
    gap: 12,
  },
  accountEmail: {
    fontSize: 13,
    color: '#777',
    flexShrink: 1,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#fdecea',
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
