import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SparkMark } from '../components/icons/SparkMark';
import { PressableScale } from '../components/PressableScale';
import { fetchAccount, type Account } from '../lib/account';
import { FREE_MONTHLY_SEARCHES, PAID_FEATURES, PAID_TIERS, PLUS_COMING_SOON, type PaidTier } from '../lib/tiers';

const BRAND_GRADIENT: [string, string] = ['#ff0080', '#ff8c00'];

export default function UpgradeScreen() {
  const [requestingTier, setRequestingTier] = useState<string | null>(null);
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

  const isPaid = account ? account.tier !== 'free' : false;

  const handleUpgrade = (tier: PaidTier) => {
    // Real billing (RevenueCat / Play Billing) isn't wired up yet — this is
    // the paywall UI and entitlement plumbing ready for that, not a live
    // purchase flow. Never fake a charge or a success state.
    setRequestingTier(tier.id);
    setTimeout(() => {
      setRequestingTier(null);
      Alert.alert(`${tier.name} is almost ready`, "We're finishing checkout — you'll be the first to know when it's live.");
    }, 400);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <TouchableOpacity style={styles.closeButton} onPress={() => router.back()} hitSlop={12}>
        <Ionicons name="close" size={26} color="#1a1a2e" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.badge}>
          <SparkMark size={36} gradient={BRAND_GRADIENT} />
        </View>
        <Text style={styles.title}>Find Fun Plans</Text>
        <Text style={styles.subtitle}>
          {isPaid ? "You're on a paid plan — thanks for backing Find Fun." : "Search more, hit fewer limits, back what's next."}
        </Text>

        <View style={styles.tierList}>
          <View style={[styles.tierCard, account?.tier === 'free' && styles.tierCardCurrent]}>
            {account?.tier === 'free' && (
              <View style={styles.currentTag}>
                <Text style={styles.currentTagText}>Current plan</Text>
              </View>
            )}
            <View style={styles.tierCardHeader}>
              <View>
                <Text style={styles.tierName}>Free</Text>
                <Text style={styles.tierDetail}>{FREE_MONTHLY_SEARCHES} searches / month</Text>
              </View>
              <Text style={styles.tierPrice}>$0</Text>
            </View>
          </View>

          {PAID_TIERS.map((tier) => {
            const isCurrent = account?.tier === tier.id;
            return (
              <LinearGradient
                key={tier.id}
                colors={BRAND_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.tierCard, isCurrent && styles.tierCardCurrent]}
              >
                {isCurrent && (
                  <View style={styles.currentTagLight}>
                    <Text style={styles.currentTagTextLight}>Current plan</Text>
                  </View>
                )}
                <View style={styles.tierCardHeader}>
                  <View>
                    <Text style={styles.tierNameLight}>{tier.name}</Text>
                    <Text style={styles.tierDetailLight}>{tier.monthlySearches} searches / month</Text>
                  </View>
                  <Text style={styles.tierPriceLight}>{tier.price}/mo</Text>
                </View>

                {isCurrent ? (
                  <View style={styles.activeBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#fff" />
                    <Text style={styles.activeBadgeText}>Active on your account</Text>
                  </View>
                ) : (
                  <PressableScale
                    onPress={() => handleUpgrade(tier)}
                    disabled={requestingTier === tier.id}
                    style={styles.ctaWrapper}
                  >
                    <View style={styles.ctaButton}>
                      <Text style={styles.ctaText}>{requestingTier === tier.id ? 'One sec…' : `Get ${tier.name}`}</Text>
                    </View>
                  </PressableScale>
                )}
              </LinearGradient>
            );
          })}
        </View>

        <View style={styles.featureList}>
          <Text style={styles.featureListHeading}>All paid plans include</Text>
          {PAID_FEATURES.map((feature) => (
            <View key={feature} style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={20} color="#0d9488" />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
          {PLUS_COMING_SOON.map((feature) => (
            <View key={feature} style={styles.featureRow}>
              <Ionicons name="time-outline" size={20} color="#999" />
              <Text style={[styles.featureText, styles.featureTextMuted]}>{feature} · coming soon</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.maybeLater}>{isPaid ? 'Done' : 'Maybe later'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 16,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: 'center',
  },
  badge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fdf2f8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  subtitle: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 24,
  },
  tierList: {
    width: '100%',
    gap: 12,
  },
  tierCard: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#f7f7fb',
  },
  tierCardCurrent: {
    borderWidth: 2,
    borderColor: '#1a1a2e',
  },
  tierCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#1a1a2e',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 8,
  },
  currentTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  currentTagLight: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 8,
  },
  currentTagTextLight: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  tierName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  tierPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  tierDetail: {
    fontSize: 12,
    color: '#777',
    marginTop: 4,
  },
  tierNameLight: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  tierPriceLight: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  tierDetailLight: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  ctaWrapper: {
    width: '100%',
    marginTop: 14,
  },
  ctaButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  ctaText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
  },
  activeBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  featureList: {
    width: '100%',
    marginTop: 24,
    gap: 14,
  },
  featureListHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  featureTextMuted: {
    color: '#999',
  },
  maybeLater: {
    marginTop: 24,
    fontSize: 14,
    color: '#999',
  },
});
