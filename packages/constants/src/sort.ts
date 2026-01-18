/**
 * Sort options for shop listings.
 * Shared across web and mobile applications.
 */

export type SortOptionValue = 'rating' | 'newest' | 'price-high' | 'price-low';

export interface SortOption {
  label: string;
  value: SortOptionValue;
}

export const SORT_OPTIONS: SortOption[] = [
  { label: 'おすすめ', value: 'rating' },
  { label: '新着順', value: 'newest' },
  { label: '高い順', value: 'price-high' },
  { label: '低い順', value: 'price-low' },
];

export type SortOrder = 'asc' | 'desc';
