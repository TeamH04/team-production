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
  /** エリアフィルター（いずれかに一致） */
  areas?: string[];
};

/**
 * 検索クエリが店舗にマッチするか判定
 * @param shop 判定対象の店舗
 * @param query 検索クエリ（小文字化済み）
 * @returns マッチする場合 true
 */
export function matchesSearchQuery(shop: Shop, query: string): boolean {
  if (!query) return true;

  const q = query.toLowerCase();
  return (
    shop.name.toLowerCase().includes(q) ||
    shop.description.toLowerCase().includes(q) ||
    shop.tags.some(tag => tag.toLowerCase().includes(q))
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

  const normalizedTags = tags.map(t => t.toLowerCase());
  return normalizedTags.some(tag => shop.tags.some(shopTag => shopTag.toLowerCase().includes(tag)));
}

/**
 * エリアが店舗にマッチするか判定（いずれかに一致）
 * @param shop 判定対象の店舗
 * @param areas エリア配列（空の場合は全てマッチ）
 * @returns マッチする場合 true
 */
export function matchesAreas(shop: Shop, areas: string[]): boolean {
  if (!areas || areas.length === 0) return true;
  if (!shop.area) return false;

  return areas.includes(shop.area);
}

/**
 * 店舗をフィルタリング
 * @param shops 店舗配列
 * @param options 検索オプション
 * @returns フィルタリング後の店舗配列
 */
export function filterShops(shops: Shop[], options: ShopSearchOptions = {}): Shop[] {
  const { query, category, tags, areas } = options;
  const normalizedQuery = query?.trim().toLowerCase() ?? '';

  return shops.filter(shop => {
    const queryMatch = matchesSearchQuery(shop, normalizedQuery);
    const categoryMatch = matchesCategory(shop, category);
    const tagsMatch = matchesTags(shop, tags ?? []);
    const areasMatch = matchesAreas(shop, areas ?? []);

    return queryMatch && categoryMatch && tagsMatch && areasMatch;
  });
}
