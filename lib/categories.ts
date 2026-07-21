import type { PlaceCategory } from './types';

export const CATEGORIES: { key: PlaceCategory; label: string; color: string; emoji: string }[] = [
  { key: 'thingsToDo', label: 'Things to Do', color: '#7c3aed', emoji: '🎉' },
  { key: 'placesToVisit', label: 'Places to Visit', color: '#0d9488', emoji: '🗺️' },
  { key: 'placesToEat', label: 'Places to Eat', color: '#ea580c', emoji: '🍽️' },
];

const CATEGORY_BY_KEY = new Map(CATEGORIES.map((category) => [category.key, category]));

export function getCategoryMeta(category: PlaceCategory) {
  // CATEGORIES covers every PlaceCategory value, so this is always found.
  return CATEGORY_BY_KEY.get(category)!;
}
