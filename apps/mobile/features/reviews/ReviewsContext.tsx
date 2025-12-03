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
};

// Contextの作成（初期値はundefined）
const ReviewsContext = createContext<ReviewsContextValue | undefined>(undefined);

// Providerコンポーネント
export function ReviewsProvider({ children }: { children: React.ReactNode }) {
  // 店舗ごとのレビュー一覧をstateで管理
  const [reviewsByShop, setReviewsByShop] = useState<ReviewsState>({});

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

  // Contextで提供する値をまとめる
  const value = useMemo<ReviewsContextValue>(
    () => ({ reviewsByShop, getReviews, addReview }),
    [reviewsByShop, getReviews, addReview]
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
