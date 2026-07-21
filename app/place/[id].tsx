import { useLocalSearchParams } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { HeartIcon } from '../../components/icons/HeartIcon';
import { PressableScale } from '../../components/PressableScale';
import { useFavorites } from '../../contexts/FavoritesContext';
import { mockPlaces } from '../../data/mockPlaces';
import { computeQualityScore } from '../../lib/ranking';

export default function PlaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const place = mockPlaces.find((candidate) => candidate.id === id);
  const { isFavorite, toggleFavorite } = useFavorites();

  if (!place) {
    return (
      <View style={styles.container}>
        <Text style={styles.notFound}>Place not found.</Text>
      </View>
    );
  }

  const favorite = isFavorite(place.id);

  return (
    <View style={styles.container}>
      <FlatList
        data={place.topReviews}
        keyExtractor={(review) => review.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={styles.name}>{place.name}</Text>
              <PressableScale scaleTo={0.75} hitSlop={12} onPress={() => toggleFavorite(place.id)}>
                <HeartIcon size={26} filled={favorite} />
              </PressableScale>
            </View>
            <Text style={styles.address}>{place.address}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.rating}>
                ★ {place.rating.toFixed(1)} ({place.reviewCount.toLocaleString()} reviews)
              </Text>
              <Text style={styles.score}>Quality score {computeQualityScore(place)}</Text>
            </View>
            <Text style={styles.reviewsHeading}>Top reviews</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <Text style={styles.reviewAuthor}>{item.author}</Text>
              <Text style={styles.reviewRating}>★ {item.rating}</Text>
            </View>
            <Text style={styles.reviewText}>{item.text}</Text>
            <Text style={styles.reviewDate}>{item.date}</Text>
          </View>
        )}
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
    paddingBottom: 24,
  },
  header: {
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a2e',
    flex: 1,
  },
  address: {
    fontSize: 14,
    color: '#777',
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
  },
  score: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3949ab',
  },
  reviewsHeading: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  reviewCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reviewAuthor: {
    fontWeight: '600',
    color: '#1a1a2e',
  },
  reviewRating: {
    color: '#444',
  },
  reviewText: {
    marginTop: 6,
    color: '#333',
    lineHeight: 20,
  },
  reviewDate: {
    marginTop: 8,
    fontSize: 12,
    color: '#999',
  },
  notFound: {
    padding: 24,
    textAlign: 'center',
    color: '#999',
  },
});
