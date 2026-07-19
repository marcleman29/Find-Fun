import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { FavoritesProvider } from '../contexts/FavoritesContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <FavoritesProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="place/[id]" options={{ headerShown: true, title: '' }} />
        </Stack>
        <StatusBar style="auto" />
      </FavoritesProvider>
    </SafeAreaProvider>
  );
}
