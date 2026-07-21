import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, StyleSheet, TextInput, View, Text } from 'react-native';

import { SearchIcon } from './icons/SearchIcon';
import { PressableScale } from './PressableScale';

interface LocationSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  onUseCurrentLocation: () => void;
  locating: boolean;
}

export function LocationSearchBar({ value, onChangeText, onSubmit, onUseCurrentLocation, locating }: LocationSearchBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          placeholder="Search a city, neighborhood, or address"
          placeholderTextColor="#999"
          returnKeyType="search"
        />
        <PressableScale onPress={onSubmit}>
          <LinearGradient
            colors={['#1a1a2e', '#3949ab']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.button}
          >
            <SearchIcon size={16} color="#fff" />
            <Text style={styles.buttonText}>Search</Text>
          </LinearGradient>
        </PressableScale>
      </View>

      <PressableScale onPress={onUseCurrentLocation} disabled={locating}>
        <View style={styles.nearMePill}>
          {locating ? (
            <ActivityIndicator size="small" color="#3949ab" />
          ) : (
            <Ionicons name="locate" size={14} color="#3949ab" />
          )}
          <Text style={styles.nearMeText}>{locating ? 'Finding you…' : 'Use my current location'}</Text>
        </View>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  nearMePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#eef2ff',
  },
  nearMeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3949ab',
  },
});
