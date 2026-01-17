import { includesIgnoreCase, normalizeString } from '@team/core-utils/stringUtils';

import type { Shop, ShopCategory } from '@team/types';

/**
 * 店舗検索オプション
 */
export type ShopSearchOptions = {
  /** 検索クエリ（店舗名、説明、タグで検索） */
  query?: string;
  /** カテゴリフィルター */
  category?: ShopCategory | null;
  /** タグフィルター（いずれかに一致） */
  tags?: string[];
};

/**
 * 検索クエリが店舗にマッチするか判定
 * @param shop 判定対象の店舗
 * @param query 検索クエリ（小文字化済み）
 * @returns マッチする場合 true
 */
export function matchesSearchQuery(shop: Shop, query: string): boolean {
  if (!query) return true;

  return (
    includesIgnoreCase(shop.name, query) ||
    includesIgnoreCase(shop.description, query) ||
    shop.tags.some(tag => includesIgnoreCase(tag, query))
  );
}

/**
 * カテゴリが店舗にマッチするか判定
 * @param shop 判定対象の店舗
 * @param category カテゴリ（null/undefinedの場合は全てマッチ）
 * @returns マッチする場合 true
 */
export function matchesCategory(shop: Shop, category: ShopCategory | null | undefined): boolean {
  if (!category) return true;
  return shop.category === category;
}

/**
 * タグが店舗にマッチするか判定（いずれかに一致）
 * @param shop 判定対象の店舗
 * @param tags タグ配列（空の場合は全てマッチ）
 * @returns マッチする場合 true
 */
export function matchesTags(shop: Shop, tags: string[]): boolean {
  if (!tags || tags.length === 0) return true;

  return tags.some(tag => shop.tags.some(shopTag => includesIgnoreCase(shopTag, tag)));
}

/**
 * 店舗をフィルタリング
 * @param shops 店舗配列
 * @param options 検索オプション
 * @returns フィルタリング後の店舗配列
 */
export function filterShops(shops: Shop[], options: ShopSearchOptions = {}): Shop[] {
  const { query, category, tags } = options;
  const normalizedQuery = query ? normalizeString(query) : '';

  return shops.filter(shop => {
    const queryMatch = matchesSearchQuery(shop, normalizedQuery);
    const categoryMatch = matchesCategory(shop, category);
    const tagsMatch = matchesTags(shop, tags ?? []);

    return queryMatch && categoryMatch && tagsMatch;
  });
}
