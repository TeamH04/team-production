import { filterShops, sortShops, type SortType } from '@team/shop-core';
import { useMemo } from 'react';

import type { Shop, ShopCategory } from '@team/types';

export type { SortType } from '@team/shop-core';

export interface UseShopFilterOptions {
  shops: Shop[];
  searchText?: string;
  sortType?: SortType;
  categories?: string[];
  tags?: string[];
}

export interface UseShopFilterResult {
  filteredShops: Shop[];
}

export function useShopFilter({
  shops,
  searchText = '',
  sortType = 'default',
  categories = [],
  tags = [],
}: UseShopFilterOptions): UseShopFilterResult {
  const filteredShops = useMemo(() => {
    // Use shop-core's filterShops for filtering logic
    // Note: filterShops expects a single category, so we filter by categories separately if multiple
    let filtered = filterShops(shops, {
      query: searchText,
      tags,
    });

    // Filter by categories if provided (shop-core only supports single category)
    if (categories.length > 0) {
      filtered = filtered.filter(
        shop => shop.category && categories.includes(shop.category as ShopCategory),
      );
    }

    // Sort using shop-core's sortShops function
    return sortShops(filtered, sortType);
  }, [shops, searchText, sortType, categories, tags]);

  return { filteredShops };
}
