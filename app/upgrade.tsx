import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SparkMark } from '../components/icons/SparkMark';
import { PressableScale } from '../components/PressableScale';
import { FREE_MONTHLY_SEARCHES, PLUS_COMING_SOON, PLUS_FEATURES, PLUS_MONTHLY_SEARCHES } from '../lib/tiers';

const BRAND_GRADIENT: [string, string] = ['#ff0080', '#ff8c00'];

export default function UpgradeScreen() {
  const [requesting, setRequesting] = useState(false);

  const handleUpgrade = () => {
    // Real billing (RevenueCat / Play Billing) isn't wired up yet — this is
    // the paywall UI and entitlement plumbing ready for that, not a live
    // purchase flow. Never fake a charge or a success state.
    setRequesting(true);
    setTimeout(() => {
      setRequesting(false);
      Alert.alert('Plus is almost ready', "We're finishing checkout — you'll be the first to know when it's live.");
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
        <Text style={styles.title}>Find Fun Plus</Text>
        <Text style={styles.subtitle}>Search more, hit fewer limits, back what's next.</Text>

        <View style={styles.tierRow}>
          <View style={styles.tierCard}>
            <Text style={styles.tierName}>Free</Text>
            <Text style={styles.tierPrice}>$0</Text>
            <Text style={styles.tierDetail}>{FREE_MONTHLY_SEARCHES} searches / month</Text>
          </View>

          <LinearGradient colors={BRAND_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.tierCard}>
            <Text style={styles.tierNameLight}>Plus</Text>
            <Text style={styles.tierPriceLight}>$4.99/mo</Text>
            <Text style={styles.tierDetailLight}>{PLUS_MONTHLY_SEARCHES.toLocaleString()} searches / month</Text>
          </LinearGradient>
        </View>

        <View style={styles.featureList}>
          {PLUS_FEATURES.map((feature) => (
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

        <PressableScale onPress={handleUpgrade} disabled={requesting} style={styles.ctaWrapper}>
          <LinearGradient colors={BRAND_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaButton}>
            <Text style={styles.ctaText}>{requesting ? 'One sec…' : 'Get Plus'}</Text>
          </LinearGradient>
        </PressableScale>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.maybeLater}>Maybe later</Text>
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
  tierRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  tierCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#f7f7fb',
  },
  tierName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  tierPrice: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a2e',
    marginTop: 4,
  },
  tierDetail: {
    fontSize: 12,
    color: '#777',
    marginTop: 6,
  },
  tierNameLight: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  tierPriceLight: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginTop: 4,
  },
  tierDetailLight: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 6,
  },
  featureList: {
    width: '100%',
    marginTop: 24,
    gap: 14,
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
  ctaWrapper: {
    width: '100%',
    marginTop: 28,
  },
  ctaButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  maybeLater: {
    marginTop: 16,
    fontSize: 14,
    color: '#999',
  },
});
