import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { getCategoryMeta } from '../lib/categories';
import type { RankedPlace } from '../lib/types';
import { HeartIcon } from './icons/HeartIcon';
import { SparkMark } from './icons/SparkMark';
import { PressableScale } from './PressableScale';

interface PlaceCardProps {
  place: RankedPlace;
  isFavorite: boolean;
  onToggleFavorite: (placeId: string) => void;
}

export function PlaceCard({ place, isFavorite, onToggleFavorite }: PlaceCardProps) {
  const topReview = place.topReviews[0];
  const { color, gradient } = getCategoryMeta(place.category);
  // Real place photos come from SerpApi; mock data and the occasional dead
  // thumbnail link fall back to a colorful category-themed banner instead of
  // a broken image icon.
  const [photoFailed, setPhotoFailed] = useState(false);
  const showPhoto = Boolean(place.photoUrl) && !photoFailed;

  return (
    <Link href={{ pathname: '/place/[id]', params: { id: place.id } }} asChild>
      <PressableScale scaleTo={0.98} style={styles.card}>
        {showPhoto ? (
          <Image
            source={{ uri: place.photoUrl }}
            style={styles.photo}
            resizeMode="cover"
            onError={() => setPhotoFailed(true)}
          />
        ) : (
          <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.photo, styles.photoFallback]}
          >
            <SparkMark size={40} color="#fff" />
          </LinearGradient>
        )}

        <View style={styles.body}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.name}>{place.name}</Text>
              <Text style={styles.address}>{place.address}</Text>
            </View>
            <PressableScale
              scaleTo={0.75}
              hitSlop={12}
              onPress={() => onToggleFavorite(place.id)}
              style={styles.favoriteButton}
            >
              <HeartIcon size={22} filled={isFavorite} />
            </PressableScale>
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
            <View style={styles.aiHighlightRow}>
              <SparkMark size={13} color={color} />
              <Text style={[styles.aiHighlight, { color }]}>{place.aiHighlight}</Text>
            </View>
          ) : (
            topReview && <Text style={styles.reviewSnippet}>"{topReview.text}"</Text>
          )}
        </View>
      </PressableScale>
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
  aiHighlightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 10,
  },
  aiHighlight: {
    flex: 1,
    fontSize: 14,
  },
});
