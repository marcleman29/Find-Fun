import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';

import { CATEGORIES } from '../lib/categories';
import type { PlaceCategory } from '../lib/types';

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
      {CATEGORIES.map(({ key, label, color, emoji }) => {
        const isSelected = key === selected;
        return (
          <TouchableOpacity
            key={key}
            onPress={() => onSelect(key)}
            style={[styles.pill, isSelected && { backgroundColor: color }]}
          >
            <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>
              {emoji} {label}
            </Text>
          </TouchableOpacity>
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
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
