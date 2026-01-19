/**
 * Sort options for shop listings.
 * Shared across web and mobile applications.
 */

import { UI_LABELS } from './ui-labels';

export type SortOptionValue = 'rating' | 'newest' | 'price-high' | 'price-low';

export interface SortOption {
  label: string;
  value: SortOptionValue;
}

export const SORT_OPTIONS: SortOption[] = [
  { label: UI_LABELS.RECOMMENDED, value: 'rating' },
  { label: UI_LABELS.SORT_NEWEST, value: 'newest' },
  { label: UI_LABELS.SORT_PRICE_HIGH, value: 'price-high' },
  { label: UI_LABELS.SORT_PRICE_LOW, value: 'price-low' },
];

export type SortOrder = 'asc' | 'desc';

/**
 * Sort type for favorites screen.
 * Compatible with @team/shop-core SortType.
 */
export type FavoritesSortType = 'newest' | 'rating-high' | 'rating-low' | 'name-asc' | 'name-desc';

export interface FavoritesSortOption {
  label: string;
  value: FavoritesSortType;
}

export const FAVORITES_SORT_OPTIONS: FavoritesSortOption[] = [
  { label: '新着順', value: 'newest' },
  { label: '評価が高い順', value: 'rating-high' },
  { label: '評価が低い順', value: 'rating-low' },
  { label: '名前順（A→Z）', value: 'name-asc' },
  { label: '名前順（Z→A）', value: 'name-desc' },
];

/**
 * Sort type for search screen.
 */
export type SearchSortType = 'default' | 'newest' | 'rating' | 'registered';

export interface SearchSortOption {
  label: string;
  value: SearchSortType;
}

export const SEARCH_SORT_OPTIONS: SearchSortOption[] = [
  { label: UI_LABELS.RECOMMENDED, value: 'default' },
  { label: UI_LABELS.SORT_NEWEST, value: 'newest' },
  { label: '評価順', value: 'rating' },
  { label: '登録順', value: 'registered' },
];
