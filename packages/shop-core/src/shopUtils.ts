import { BUDGET_LABEL } from './constants';

import type { Shop } from '@team/types';

// =============================================================================
// カテゴリ・タグ抽出ユーティリティ
// =============================================================================

/**
 * ショップ一覧からカテゴリ一覧を抽出
 * @param shops ショップ配列
 * @returns ソート済みのユニークなカテゴリ配列
 *
 * @example
 * ```ts
 * const categories = extractCategories(shops);
 * // ['カフェ', 'ラーメン', 'レストラン']
 * ```
 */
export function extractCategories(shops: Shop[]): string[] {
  const categorySet = new Set<string>();
  for (const shop of shops) {
    categorySet.add(shop.category);
  }
  return Array.from(categorySet).sort();
}

/**
 * ショップ一覧からカテゴリごとのタグマップを抽出
 * @param shops ショップ配列
 * @returns カテゴリをキーとしたタグ配列のレコード
 *
 * @example
 * ```ts
 * const tagsByCategory = extractTagsByCategory(shops);
 * // { 'カフェ': ['Wi-Fi', '静か'], 'ラーメン': ['こってり', 'あっさり'] }
 * ```
 */
export function extractTagsByCategory(shops: Shop[]): Record<string, string[]> {
  const categoryTagsMap = new Map<string, Set<string>>();

  for (const shop of shops) {
    const category = shop.category;

    let tagSet = categoryTagsMap.get(category);
    if (!tagSet) {
      tagSet = new Set<string>();
      categoryTagsMap.set(category, tagSet);
    }

    for (const tag of shop.tags ?? []) {
      tagSet.add(tag);
    }
  }

  return Object.fromEntries(
    Array.from(categoryTagsMap.entries(), ([category, tagSet]) => [
      category,
      Array.from(tagSet).sort(),
    ]),
  ) as Record<string, string[]>;
}

// =============================================================================
// メタ情報フォーマット
// =============================================================================

export type ShopMetaFormat = 'full' | 'compact';

/**
 * 店舗のメタ情報をフォーマットする
 * @param shop 店舗データ
 * @param format フォーマット形式 ('full' | 'compact')
 * @returns フォーマット済みメタ文字列
 */
export function formatShopMeta(shop: Shop, format: ShopMetaFormat = 'full'): string {
  if (format === 'compact') {
    // SearchScreen用: カテゴリ • 予算 • 徒歩X分
    return `${shop.category}${shop.budget ? ` • ${shop.budget}` : ''} • 徒歩${shop.distanceMinutes}分`;
  }
  // FavoritesScreen用（デフォルト）: カテゴリ • 徒歩X分 • 予算 ¥
  return `${shop.category} • 徒歩${shop.distanceMinutes}分 • 予算 ${BUDGET_LABEL[shop.budget]}`;
}

/**
 * Shop の画像URL配列を取得する
 * imageUrls が存在し要素がある場合はそれを返し、
 * そうでなければ imageUrl を配列として返す
 * 常に最低1つの画像URLを含む配列を返すことを保証する
 */
export function getShopImages(shop: Shop): string[] {
  return shop.imageUrls?.length ? shop.imageUrls : [shop.imageUrl];
}
