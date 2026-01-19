import type { ApiFile, ApiMenu, ApiReview, Review, ReviewFile } from '@team/types';

/**
 * APIレビューのファイルをフロントエンド型に変換
 */
export function mapApiReviewFile(file: ApiFile): ReviewFile {
  return {
    id: file.file_id,
    fileName: file.file_name,
    objectKey: file.object_key,
    url: file.url ?? undefined,
    contentType: file.content_type ?? undefined,
  };
}

/**
 * APIレビューをフロントエンド型に変換
 *
 * @param review - APIから返されたレビュー
 * @returns フロントエンド用のレビュー型
 *
 * @example
 * ```ts
 * const apiReviews = await api.fetchStoreReviews(shopId, sort, token);
 * const reviews = apiReviews.map(mapApiReview);
 * ```
 */
export function mapApiReview(review: ApiReview): Review {
  const menus: ApiMenu[] = review.menus ?? [];
  const menuItemIds = menus.length > 0 ? menus.map(menu => menu.menu_id) : (review.menu_ids ?? []);
  const menuItemName = menus.length > 0 ? menus.map(menu => menu.name).join(' / ') : undefined;

  return {
    id: review.review_id,
    shopId: review.store_id,
    userId: review.user_id,
    rating: review.rating,
    ratingDetails: review.rating_details ?? undefined,
    comment: review.content ?? undefined,
    createdAt: review.created_at,
    menuItemIds: menuItemIds && menuItemIds.length > 0 ? menuItemIds : undefined,
    menuItemName,
    likesCount: review.likes_count ?? 0,
    likedByMe: review.liked_by_me ?? false,
    files: (review.files ?? []).map(mapApiReviewFile),
  };
}

/**
 * ReviewFile から表示用 URL を取得する
 * file.url が存在すればそれを、なければ objectKey を返す
 * @param file ReviewFile オブジェクト
 * @returns 表示用 URL または undefined
 */
export function getReviewFileUrl(file: ReviewFile): string | undefined {
  return file.url ?? file.objectKey;
}
