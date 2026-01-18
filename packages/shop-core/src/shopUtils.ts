import type { Shop } from '@team/types';

/**
 * Shop の画像URL配列を取得する
 * imageUrls が存在し要素がある場合はそれを返し、
 * そうでなければ imageUrl を配列として返す
 * 常に最低1つの画像URLを含む配列を返すことを保証する
 */
export function getShopImages(shop: Shop): string[] {
  return shop.imageUrls?.length ? shop.imageUrls : [shop.imageUrl];
}
