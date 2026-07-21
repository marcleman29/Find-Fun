import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { CATEGORIES } from '../lib/categories';
import type { PlaceCategory } from '../lib/types';
import { PressableScale } from './PressableScale';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface CategoryPillsProps {
  selected: PlaceCategory;
  onSelect: (category: PlaceCategory) => void;
}

export function CategoryPills({ selected, onSelect }: CategoryPillsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {CATEGORIES.map(({ key, label, gradient, color, icon }) => {
        const isSelected = key === selected;
        return (
          <PressableScale key={key} onPress={() => onSelect(key)}>
            {isSelected ? (
              <LinearGradient
                colors={gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.pill}
              >
                <Ionicons name={icon as IoniconName} size={15} color="#fff" />
                <Text style={[styles.pillText, styles.pillTextSelected]}>{label}</Text>
              </LinearGradient>
            ) : (
              <View style={styles.pill}>
                <Ionicons name={`${icon}-outline` as IoniconName} size={15} color={color} />
                <Text style={styles.pillText}>{label}</Text>
              </View>
            )}
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    overflow: 'hidden',
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
  },
  pillTextSelected: {
    color: '#fff',
  },
});
