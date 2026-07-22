import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { PlaceCard } from '../../components/PlaceCard';
import { PressableScale } from '../../components/PressableScale';
import { useAuth } from '../../contexts/AuthContext';
import { useFavorites } from '../../contexts/FavoritesContext';
import { fetchAccount, type Account } from '../../lib/account';
import { mockPlaces } from '../../data/mockPlaces';
import { rankPlaces } from '../../lib/ranking';

export default function SavedScreen() {
  const { favoriteIds, isFavorite, toggleFavorite } = useFavorites();
  const { session, signOut } = useAuth();
  const [account, setAccount] = useState<Account | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      fetchAccount().then((result) => {
        if (!cancelled) setAccount(result);
      });
      return () => {
        cancelled = true;
      };
    }, [])
  );

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

      {account && (
        <TouchableOpacity
          style={[styles.planRow, account.tier === 'paid' && styles.planRowPaid]}
          onPress={() => router.push('/upgrade')}
          activeOpacity={0.85}
        >
          <Ionicons
            name={account.tier === 'paid' ? 'checkmark-circle' : 'lock-closed'}
            size={16}
            color={account.tier === 'paid' ? '#0d9488' : '#999'}
          />
          <Text style={[styles.planText, account.tier === 'paid' && styles.planTextPaid]}>
            {account.tier === 'paid' ? 'Plus plan' : 'Free plan'} · {account.searchesUsed}/{account.searchLimit}{' '}
            searches this month
          </Text>
          {account.tier === 'free' && <Text style={styles.planUpgradeLink}>Upgrade</Text>}
        </TouchableOpacity>
      )}

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
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  planRowPaid: {
    backgroundColor: '#f0fdfa',
  },
  planText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  planTextPaid: {
    color: '#0d9488',
  },
  planUpgradeLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3949ab',
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
