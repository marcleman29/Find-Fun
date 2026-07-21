import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { HeartIcon } from '../../components/icons/HeartIcon';
import { PressableScale } from '../../components/PressableScale';
import { useFavorites } from '../../contexts/FavoritesContext';
import { mockPlaces } from '../../data/mockPlaces';
import { fetchLikeCounts, toggleLike, type LikeInfo } from '../../lib/likes';
import { rankPlaces } from '../../lib/ranking';
import type { RankedPlace } from '../../lib/types';

export default function PlaceDetailScreen() {
  const { id, place: placeParam } = useLocalSearchParams<{ id: string; place?: string }>();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [likeInfo, setLikeInfo] = useState<LikeInfo>({ count: 0, likedByMe: false });
  const [liking, setLiking] = useState(false);

  // PlaceCard passes the full place it already has (real SerpApi results or
  // AI-ranked mock data) via params — looking it up by id in the bundled
  // mock dataset only worked by coincidence when every place WAS mock data.
  // Once real places came from search, their SerpApi ids never matched
  // mockPlaces, so this always resolved to "Place not found."
  let place: RankedPlace | undefined;
  if (placeParam) {
    try {
      place = JSON.parse(placeParam) as RankedPlace;
    } catch {
      place = undefined;
    }
  }
  if (!place) {
    const fallback = mockPlaces.find((candidate) => candidate.id === id);
    place = fallback ? rankPlaces([fallback])[0] : undefined;
  }

  useEffect(() => {
    if (!place) return;
    fetchLikeCounts([place.id]).then((likes) => {
      const info = likes[place!.id];
      if (info) setLikeInfo(info);
    });
  }, [place?.id]);

  if (!place) {
    return (
      <View style={styles.container}>
        <Text style={styles.notFound}>Place not found.</Text>
      </View>
    );
  }

  const favorite = isFavorite(place.id);

  const handleLike = async () => {
    // Guard against a rapid double-tap firing two toggles before the first
    // resolves — the server does a read-then-write, not an atomic upsert,
    // so two concurrent requests can race into a duplicate-key error.
    if (liking) return;
    setLiking(true);
    // Optimistic update — a failed toggle just means the next fetch
    // corrects it, not worth blocking the tap on a round trip.
    setLikeInfo((prev) => ({ count: prev.likedByMe ? prev.count - 1 : prev.count + 1, likedByMe: !prev.likedByMe }));
    const result = await toggleLike(place!.id);
    if (result) setLikeInfo(result);
    setLiking(false);
  };

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
              <PressableScale scaleTo={0.75} hitSlop={12} onPress={() => toggleFavorite(place!.id)}>
                <HeartIcon size={26} filled={favorite} />
              </PressableScale>
            </View>
            <Text style={styles.address}>{place.address}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.rating}>
                ★ {place.rating.toFixed(1)} ({place.reviewCount.toLocaleString()} reviews)
              </Text>
              <Text style={styles.score}>Quality score {place.qualityScore}</Text>
            </View>

            <PressableScale onPress={handleLike} disabled={liking}>
              <View style={styles.likeButton}>
                <Ionicons
                  name={likeInfo.likedByMe ? 'thumbs-up' : 'thumbs-up-outline'}
                  size={16}
                  color={likeInfo.likedByMe ? '#0d9488' : '#666'}
                />
                <Text style={[styles.likeText, likeInfo.likedByMe && styles.likeTextActive]}>
                  {likeInfo.count > 0
                    ? `${likeInfo.count} ${likeInfo.count === 1 ? 'like' : 'likes'}`
                    : 'Like this place'}
                </Text>
              </View>
            </PressableScale>

            {place.aiHighlight && <Text style={styles.aiHighlight}>✨ {place.aiHighlight}</Text>}

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
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  likeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  likeTextActive: {
    color: '#0d9488',
  },
  aiHighlight: {
    marginTop: 10,
    fontSize: 14,
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
