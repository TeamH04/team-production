import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type Review = {
  id: string;
  shopId: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string; // ISO string
  menuItemId?: string;
  menuItemName?: string;
};

type ReviewsState = Record<string, Review[]>; // by shopId

type ReviewsContextValue = {
  reviewsByShop: ReviewsState;
  getReviews: (shopId: string) => Review[];
  addReview: (
    shopId: string,
    input: { rating: number; comment: string; menuItemId?: string; menuItemName?: string }
  ) => void;
};

const ReviewsContext = createContext<ReviewsContextValue | undefined>(undefined);

export function ReviewsProvider({ children }: { children: React.ReactNode }) {
  const [reviewsByShop, setReviewsByShop] = useState<ReviewsState>({});

  const getReviews = useCallback((shopId: string) => reviewsByShop[shopId] ?? [], [reviewsByShop]);

  const addReview = useCallback((
    shopId: string,
    input: { rating: number; comment: string; menuItemId?: string; menuItemName?: string }
  ) => {
    setReviewsByShop((prev) => {
      const next = { ...prev };
      const entry: Review = {
        id: `${shopId}-${Date.now()}`,
        shopId,
        rating: Math.max(1, Math.min(5, Math.round(input.rating))),
        comment: input.comment.trim(),
        createdAt: new Date().toISOString(),
        menuItemId: input.menuItemId,
        menuItemName: input.menuItemName,
      };
      next[shopId] = [entry, ...(prev[shopId] ?? [])];
      return next;
    });
  }, []);

  const value = useMemo<ReviewsContextValue>(() => ({ reviewsByShop, getReviews, addReview }), [reviewsByShop, getReviews, addReview]);

  return <ReviewsContext.Provider value={value}>{children}</ReviewsContext.Provider>;
}

export function useReviews() {
  const ctx = useContext(ReviewsContext);
  if (!ctx) throw new Error('useReviews must be used within ReviewsProvider');
  return ctx;
}
