/**
 * Sort options for shop listings.
 *
 * @team/constants パッケージから re-export
 */
export {
  SORT_OPTIONS,
  type SortOption,
  type SortOptionValue,
  type SortOrder,
} from '@team/constants';

import type { SortType } from '@team/shop-core';

/**
 * お気に入り画面用のソートオプション
 */
export interface FavoritesSortOption {
  label: string;
  value: SortType;
}

export const FAVORITES_SORT_OPTIONS: FavoritesSortOption[] = [
  { label: '新着順', value: 'newest' },
  { label: '評価が高い順', value: 'rating-high' },
  { label: '評価が低い順', value: 'rating-low' },
  { label: '名前順（A→Z）', value: 'name-asc' },
  { label: '名前順（Z→A）', value: 'name-desc' },
];

/**
 * 検索画面用のソートオプション
 */
export type SearchSortType = 'default' | 'newest' | 'rating' | 'registered';

export interface SearchSortOption {
  label: string;
  value: SearchSortType;
}

export const SEARCH_SORT_OPTIONS: SearchSortOption[] = [
  { label: 'おすすめ', value: 'default' },
  { label: '新着順', value: 'newest' },
  { label: '評価順', value: 'rating' },
  { label: '登録順', value: 'registered' },
];
