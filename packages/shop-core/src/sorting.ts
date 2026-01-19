import type { Shop, SortType } from '@team/types';

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
