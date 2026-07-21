import { Tabs } from 'expo-router';
import { Text } from 'react-native';

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
          headerTitle: 'Find Fun 🎉',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🔎</Text>,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Saved',
          headerTitle: 'Your Saved Places',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>♥</Text>,
        }}
      />
    </Tabs>
  );
}
