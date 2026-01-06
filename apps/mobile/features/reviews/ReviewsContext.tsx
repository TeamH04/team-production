import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

// レビューの型定義
export type Review = {
  id: string; // レビューID（ユニーク）
  shopId: string; // 店舗ID
  rating: number; // 評価（1〜5）
  comment: string; // コメント
  createdAt: string; // 作成日時（ISO文字列）
  menuItemId?: string; // メニューID（任意）
  menuItemName?: string; // メニュー名（任意）
  likedBy?: Set<string>; // いいねしたユーザーIDの集合（オプション）
};

// 店舗ごとのレビュー一覧（shopIdごとに配列で管理）
type ReviewsState = Record<string, Review[]>;

// Contextで提供する値の型
type ReviewsContextValue = {
  reviewsByShop: ReviewsState; // 店舗ごとのレビュー一覧
  getReviews: (shopId: string) => Review[]; // 店舗IDでレビュー取得
  addReview: (
    shopId: string,
    input: { rating: number; comment: string; menuItemId?: string; menuItemName?: string }
  ) => void; // レビュー追加
  deleteReview: (reviewId: string) => void; // レビュー削除
  toggleReviewLike: (reviewId: string) => void; // レビューのいいねトグル
  isReviewLiked: (reviewId: string) => boolean; // レビューのいいね状態を確認
  getReviewLikesCount: (reviewId: string) => number; // レビューのいいね数を取得
  getLikedReviews: () => Review[]; // いいねしたレビューを全て取得
};

// Contextの作成（初期値はundefined）
const ReviewsContext = createContext<ReviewsContextValue | undefined>(undefined);

// Providerコンポーネント
export function ReviewsProvider({ children }: { children: React.ReactNode }) {
  // 店舗ごとのレビュー一覧をstateで管理
  const [reviewsByShop, setReviewsByShop] = useState<ReviewsState>({});
  // いいねしたレビューのセット（レビューID）
  const [likedReviewIds, setLikedReviewIds] = useState<Set<string>>(new Set());

  // 店舗IDでレビュー一覧を取得する関数
  const getReviews = useCallback((shopId: string) => reviewsByShop[shopId] ?? [], [reviewsByShop]);

  // レビューを追加する関数
  const addReview = useCallback(
    (
      shopId: string,
      input: { rating: number; comment: string; menuItemId?: string; menuItemName?: string }
    ) => {
      setReviewsByShop(prev => {
        const next = { ...prev };
        // 新しいレビューを作成
        const entry: Review = {
          id: `${shopId}-${Date.now()}`, // 一意なIDを生成
          shopId,
          rating: Math.max(1, Math.min(5, Math.round(input.rating))), // 1〜5の範囲に丸める
          comment: input.comment.trim(), // 余分な空白を除去
          createdAt: new Date().toISOString(), // 現在日時
          menuItemId: input.menuItemId,
          menuItemName: input.menuItemName,
        };
        // 新しいレビューを先頭に追加
        next[shopId] = [entry, ...(prev[shopId] ?? [])];
        return next;
      });
    },
    []
  );

  // レビューを削除する関数
  const deleteReview = useCallback((reviewId: string) => {
    setReviewsByShop(prev => {
      const next = { ...prev };
      // 全店舗のレビューから指定IDを削除
      for (const shopId of Object.keys(next)) {
        const filtered = next[shopId].filter(review => review.id !== reviewId);
        if (filtered.length !== next[shopId].length) {
          next[shopId] = filtered;
          break; // レビューが見つかったら終了
        }
      }
      return next;
    });
  }, []);

  // レビューのいいねをトグルする関数
  /**
   * レビューのいいね状態をトグルします
   * @param reviewId - トグルするレビューのID
   */
  const toggleReviewLike = useCallback((reviewId: string) => {
    setLikedReviewIds(prev => {
      const next = new Set(prev);
      if (next.has(reviewId)) {
        next.delete(reviewId);
      } else {
        next.add(reviewId);
      }
      return next;
    });
  }, []);

  // レビューのいいね状態を確認する関数
  /**
   * レビューのいいね状態を確認します
   * @param reviewId - 確認するレビューのID
   * @returns レビューが「いいね」されている場合はtrue
   */
  const isReviewLiked = useCallback(
    (reviewId: string) => likedReviewIds.has(reviewId),
    [likedReviewIds]
  );

  // レビューのいいね数を取得する関数
  /**
   * レビューのいいね数を取得します
   * @param reviewId - いいね数を取得するレビューのID
   * @returns いいね数（0または1）
   */
  const getReviewLikesCount = useCallback(
    (reviewId: string) => {
      // レビューを検索して likedBy があれば、そのサイズをいいね数として返す
      const allReviews = Object.values(reviewsByShop).flat();
      const review = allReviews.find(r => r.id === reviewId);
      if (review && review.likedBy instanceof Set) {
        return review.likedBy.size;
      }
      // likedBy が未使用の場合は、従来どおり reviewId がいいねされているかで 0/1 を返す
      return isReviewLiked(reviewId) ? 1 : 0;
    },
    [reviewsByShop, isReviewLiked]
  );

  // いいねしたレビューを全て取得する関数
  /**
   * いいねしたレビューを全て取得します
   * @returns いいねしたレビューの配列
   */
  const getLikedReviews = useCallback(() => {
    const allReviews = Object.values(reviewsByShop).flat();
    return allReviews.filter(review => likedReviewIds.has(review.id));
  }, [reviewsByShop, likedReviewIds]);

  // Contextで提供する値をまとめる
  const value = useMemo<ReviewsContextValue>(
    () => ({
      reviewsByShop,
      getReviews,
      addReview,
      deleteReview,
      toggleReviewLike,
      isReviewLiked,
      getReviewLikesCount,
      getLikedReviews,
    }),
    [
      reviewsByShop,
      getReviews,
      addReview,
      deleteReview,
      toggleReviewLike,
      isReviewLiked,
      getReviewLikesCount,
      getLikedReviews,
    ]
  );

  // Providerで子コンポーネントをラップ
  return <ReviewsContext.Provider value={value}>{children}</ReviewsContext.Provider>;
}

// Contextを使うためのカスタムフック
export function useReviews() {
  const ctx = useContext(ReviewsContext);
  if (!ctx) throw new Error('useReviews must be used within ReviewsProvider'); // Provider外で使うとエラー
  return ctx;
}
