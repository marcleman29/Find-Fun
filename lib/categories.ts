import type { PlaceCategory } from './types';

export const CATEGORIES: { key: PlaceCategory; label: string; color: string; gradient: [string, string]; icon: string }[] = [
  { key: 'thingsToDo', label: 'Things to Do', color: '#7c3aed', gradient: ['#7c3aed', '#c026d3'], icon: 'sparkles' },
  { key: 'placesToVisit', label: 'Places to Visit', color: '#0d9488', gradient: ['#0d9488', '#22d3ee'], icon: 'map' },
  { key: 'placesToEat', label: 'Places to Eat', color: '#ea580c', gradient: ['#ea580c', '#f59e0b'], icon: 'restaurant' },
];

const CATEGORY_BY_KEY = new Map(CATEGORIES.map((category) => [category.key, category]));

export function getCategoryMeta(category: PlaceCategory) {
  // CATEGORIES covers every PlaceCategory value, so this is always found.
  return CATEGORY_BY_KEY.get(category)!;
}
