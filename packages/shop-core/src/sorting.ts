import type { FavoritesSortType, SearchSortType, SortOrder } from '@team/constants';
import type { Shop, SortType } from '@team/types';

// =============================================================================
// ソートラベルユーティリティ
// =============================================================================

/**
 * ソート順序のラベルを取得する
 * @param sortBy ソート種別
 * @param order ソート順序（昇順/降順）
 * @returns 日本語のラベル文字列
 *
 * @example
 * ```ts
 * getSortOrderLabel('newest', 'desc'); // '新しい順'
 * getSortOrderLabel('rating', 'asc');  // '低い順'
 * ```
 */
export function getSortOrderLabel(sortBy: SearchSortType, order: SortOrder): string {
  switch (sortBy) {
    case 'newest':
    case 'registered':
      return order === 'desc' ? '新しい順' : '古い順';
    case 'rating':
      return order === 'desc' ? '高い順' : '低い順';
    default:
      return '';
  }
}

// =============================================================================
// ショップソート
// =============================================================================

/**
 * Sort shops by the specified sort type
 *
 * @param shops - Array of shops to sort
 * @param sortType - The type of sorting to apply
 * @returns A new sorted array (does not mutate the original)
 *
 * @example
 * ```ts
 * const sortedByRating = sortShops(shops, 'rating-high');
 * const sortedByName = sortShops(shops, 'name-asc');
 * ```
 */
export function sortShops(shops: Shop[], sortType: SortType): Shop[] {
  if (sortType === 'default') {
    return shops;
  }

  const sorted = [...shops];

  switch (sortType) {
    case 'rating-high':
      sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      break;
    case 'rating-low':
      sorted.sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0));
      break;
    case 'name-asc':
      sorted.sort((a, b) => a.name.localeCompare(b.name, 'ja'));
      break;
    case 'name-desc':
      sorted.sort((a, b) => b.name.localeCompare(a.name, 'ja'));
      break;
    case 'newest':
      sorted.sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime());
      break;
  }

  return sorted;
}

// =============================================================================
// お気に入りソート変換
// =============================================================================

/**
 * FavoritesSortType を SortType に変換する
 * @param favoriteSort お気に入りソート種別
 * @returns 汎用ソート種別
 *
 * @example
 * ```ts
 * favoriteSortToSortType('rating-high'); // 'rating-high'
 * favoriteSortToSortType('newest');      // 'newest'
 * ```
 */
export function favoriteSortToSortType(favoriteSort: FavoritesSortType): SortType {
  switch (favoriteSort) {
    case 'newest':
      return 'newest';
    case 'rating-high':
      return 'rating-high';
    case 'rating-low':
      return 'rating-low';
    case 'name-asc':
      return 'name-asc';
    case 'name-desc':
      return 'name-desc';
    default:
      return 'default';
  }
}
