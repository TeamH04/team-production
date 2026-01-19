import { BUDGET_LABEL } from './constants';

import type { Shop } from '@team/types';

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
