import { Link } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { RankedPlace } from '../lib/types';

interface PlaceCardProps {
  place: RankedPlace;
  isFavorite: boolean;
  onToggleFavorite: (placeId: string) => void;
}

export function PlaceCard({ place, isFavorite, onToggleFavorite }: PlaceCardProps) {
  const topReview = place.topReviews[0];

  return (
    <Link href={{ pathname: '/place/[id]', params: { id: place.id } }} asChild>
      <TouchableOpacity style={styles.card}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.name}>{place.name}</Text>
            <Text style={styles.address}>{place.address}</Text>
          </View>
          <TouchableOpacity
            hitSlop={12}
            onPress={() => onToggleFavorite(place.id)}
            style={styles.favoriteButton}
          >
            <Text style={styles.favoriteIcon}>{isFavorite ? '♥' : '♡'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.rating}>
            ★ {place.rating.toFixed(1)} ({place.reviewCount.toLocaleString()})
          </Text>
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreBadgeText}>Quality score {place.qualityScore}</Text>
          </View>
        </View>

        {topReview && <Text style={styles.reviewSnippet}>"{topReview.text}"</Text>}
      </TouchableOpacity>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
    paddingRight: 8,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  address: {
    fontSize: 13,
    color: '#777',
    marginTop: 2,
  },
  favoriteButton: {
    padding: 4,
  },
  favoriteIcon: {
    fontSize: 22,
    color: '#e0245e',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
  },
  scoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#eef2ff',
  },
  scoreBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3949ab',
  },
  reviewSnippet: {
    marginTop: 10,
    fontSize: 14,
    fontStyle: 'italic',
    color: '#555',
  },
});
