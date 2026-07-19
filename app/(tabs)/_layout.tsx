import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#1a1a2e' }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Search',
          headerTitle: 'Find Fun',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>🔎</Text>,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Saved',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 18 }}>♥</Text>,
        }}
      />
    </Tabs>
  );
}
