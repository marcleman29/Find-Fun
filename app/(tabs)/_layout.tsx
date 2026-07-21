import { Tabs } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { HeartIcon } from '../../components/icons/HeartIcon';
import { SearchIcon } from '../../components/icons/SearchIcon';
import { SparkMark } from '../../components/icons/SparkMark';

const BRAND_GRADIENT: [string, string] = ['#ff0080', '#ff8c00'];

function BrandHeaderTitle() {
  return (
    <View style={styles.headerTitleRow}>
      <Text style={styles.headerTitleText}>Find Fun</Text>
      <SparkMark size={20} gradient={BRAND_GRADIENT} />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1a1a2e',
        headerStyle: { backgroundColor: '#1a1a2e' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Search',
          headerTitle: BrandHeaderTitle,
          tabBarIcon: ({ color }) => <SearchIcon size={20} color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Saved',
          headerTitle: 'Your Saved Places',
          tabBarIcon: ({ color }) => <HeartIcon size={20} filled color={String(color)} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitleText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
  },
});
