import { Link } from 'expo-router';
import { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { getCategoryMeta } from '../lib/categories';
import type { RankedPlace } from '../lib/types';

interface PlaceCardProps {
  place: RankedPlace;
  isFavorite: boolean;
  onToggleFavorite: (placeId: string) => void;
}

export function PlaceCard({ place, isFavorite, onToggleFavorite }: PlaceCardProps) {
  const topReview = place.topReviews[0];
  const { color, emoji } = getCategoryMeta(place.category);
  // Real place photos come from SerpApi; mock data and the occasional dead
  // thumbnail link fall back to a colorful category-themed banner instead of
  // a broken image icon.
  const [photoFailed, setPhotoFailed] = useState(false);
  const showPhoto = Boolean(place.photoUrl) && !photoFailed;

  return (
    <Link href={{ pathname: '/place/[id]', params: { id: place.id } }} asChild>
      <TouchableOpacity style={styles.card}>
        {showPhoto ? (
          <Image
            source={{ uri: place.photoUrl }}
            style={styles.photo}
            resizeMode="cover"
            onError={() => setPhotoFailed(true)}
          />
        ) : (
          <View style={[styles.photo, styles.photoFallback, { backgroundColor: color }]}>
            <Text style={styles.photoFallbackEmoji}>{emoji}</Text>
          </View>
        )}

        <View style={styles.body}>
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
            <View style={[styles.scoreBadge, { backgroundColor: `${color}1a` }]}>
              <Text style={[styles.scoreBadgeText, { color }]}>
                {place.aiHighlight !== undefined ? 'AI score' : 'Quality score'} {place.qualityScore}
              </Text>
            </View>
          </View>

          {place.aiHighlight ? (
            <Text style={[styles.aiHighlight, { color }]}>✨ {place.aiHighlight}</Text>
          ) : (
            topReview && <Text style={styles.reviewSnippet}>"{topReview.text}"</Text>
          )}
        </View>
      </TouchableOpacity>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 14,
    backgroundColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  photo: {
    width: '100%',
    height: 130,
  },
  photoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoFallbackEmoji: {
    fontSize: 40,
  },
  body: {
    padding: 16,
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
  aiHighlight: {
    marginTop: 10,
    fontSize: 14,
    color: '#3949ab',
  },
});
