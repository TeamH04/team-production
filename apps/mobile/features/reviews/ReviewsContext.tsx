import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import {
  createReview,
  createReviewUploads,
  fetchStoreReviews,
  fetchUserReviews,
  likeReview,
  type ApiReview,
  type ReviewSort,
  type UploadFileInput,
  unlikeReview,
} from '@/lib/api';
import { getAccessToken, getCurrentUser } from '@/lib/auth';

export type ReviewFile = {
  id: string;
  fileName: string;
  objectKey: string;
  contentType?: string | null;
};

export type Review = {
  id: string;
  shopId: string;
  userId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  likesCount: number;
  likedByMe: boolean;
  files: ReviewFile[];
};

export type ReviewAsset = {
  uri: string;
  fileName: string;
  contentType: string;
  fileSize?: number;
};

type ReviewsState = Record<string, Review[]>;

type ReviewsContextValue = {
  reviewsByShop: ReviewsState;
  loadingByShop: Record<string, boolean>;
  getReviews: (shopId: string) => Review[];
  loadReviews: (shopId: string, sort: ReviewSort) => Promise<void>;
  addReview: (
    shopId: string,
    input: { rating: number; comment?: string },
    assets: ReviewAsset[]
  ) => Promise<void>;
  toggleLike: (shopId: string, reviewId: string) => Promise<void>;
  loadUserReviews: () => Promise<void>;
};

const ReviewsContext = createContext<ReviewsContextValue | undefined>(undefined);

const AUTH_REQUIRED = 'auth_required';

function mapApiReview(review: ApiReview): Review {
  return {
    id: review.review_id,
    shopId: review.store_id,
    userId: review.user_id,
    rating: review.rating,
    comment: review.content ?? undefined,
    createdAt: review.created_at,
    likesCount: review.likes_count ?? 0,
    likedByMe: review.liked_by_me ?? false,
    files: (review.files ?? []).map(file => ({
      id: file.file_id,
      fileName: file.file_name,
      objectKey: file.object_key,
      contentType: file.content_type ?? undefined,
    })),
  };
}

async function uploadToSignedUrl(uploadUrl: string, asset: ReviewAsset) {
  const source = await fetch(asset.uri);
  const blob = await source.blob();
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': asset.contentType,
    },
    body: blob,
  });
  if (!res.ok) {
    throw new Error('upload failed');
  }
}

export function ReviewsProvider({ children }: { children: React.ReactNode }) {
  const [reviewsByShop, setReviewsByShop] = useState<ReviewsState>({});
  const [loadingByShop, setLoadingByShop] = useState<Record<string, boolean>>({});

  const getReviews = useCallback((shopId: string) => reviewsByShop[shopId] ?? [], [reviewsByShop]);

  const loadReviews = useCallback(async (shopId: string, sort: ReviewSort) => {
    setLoadingByShop(prev => ({ ...prev, [shopId]: true }));
    try {
      const token = await getAccessToken();
      const reviews = await fetchStoreReviews(shopId, sort, token ?? undefined);
      setReviewsByShop(prev => ({ ...prev, [shopId]: reviews.map(mapApiReview) }));
    } finally {
      setLoadingByShop(prev => ({ ...prev, [shopId]: false }));
    }
  }, []);

  const addReview = useCallback(
    async (shopId: string, input: { rating: number; comment?: string }, assets: ReviewAsset[]) => {
      const token = await getAccessToken();
      if (!token) {
        throw new Error(AUTH_REQUIRED);
      }

      let fileIDs: string[] = [];
      if (assets.length > 0) {
        const uploadInputs: UploadFileInput[] = assets.map(asset => ({
          file_name: asset.fileName,
          file_size: asset.fileSize,
          content_type: asset.contentType,
        }));
        const uploadResult = await createReviewUploads(shopId, uploadInputs, token);
        const uploads = uploadResult.files;
        if (uploads.length !== assets.length) {
          throw new Error('upload mismatch');
        }
        await Promise.all(
          uploads.map((upload, index) => uploadToSignedUrl(upload.upload_url, assets[index]))
        );
        fileIDs = uploads.map(upload => upload.file_id);
      }

      await createReview(
        shopId,
        {
          rating: input.rating,
          content: input.comment ?? null,
          file_ids: fileIDs,
        },
        token
      );

      await loadReviews(shopId, 'new');
    },
    [loadReviews]
  );

  const toggleLike = useCallback(async (shopId: string, reviewId: string) => {
    const token = await getAccessToken();
    if (!token) {
      throw new Error(AUTH_REQUIRED);
    }

    let wasLiked = false;
    setReviewsByShop(prev => {
      const current = prev[shopId] ?? [];
      const next = current.map(review => {
        if (review.id !== reviewId) return review;
        wasLiked = review.likedByMe;
        return {
          ...review,
          likedByMe: !review.likedByMe,
          likesCount: review.likesCount + (review.likedByMe ? -1 : 1),
        };
      });
      return { ...prev, [shopId]: next };
    });

    try {
      if (wasLiked) {
        await unlikeReview(reviewId, token);
      } else {
        await likeReview(reviewId, token);
      }
    } catch (err) {
      setReviewsByShop(prev => {
        const current = prev[shopId] ?? [];
        const next = current.map(review => {
          if (review.id !== reviewId) return review;
          return {
            ...review,
            likedByMe: wasLiked,
            likesCount: review.likesCount + (wasLiked ? 1 : -1),
          };
        });
        return { ...prev, [shopId]: next };
      });
      throw err;
    }
  }, []);

  const loadUserReviews = useCallback(async () => {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error(AUTH_REQUIRED);
    }
    const token = await getAccessToken();
    if (!token) {
      throw new Error(AUTH_REQUIRED);
    }
    const reviews = await fetchUserReviews(user.id, token);
    const grouped: ReviewsState = {};
    reviews.map(mapApiReview).forEach(review => {
      if (!grouped[review.shopId]) {
        grouped[review.shopId] = [];
      }
      grouped[review.shopId].push(review);
    });
    setReviewsByShop(prev => ({ ...prev, ...grouped }));
  }, []);

  const value = useMemo<ReviewsContextValue>(
    () => ({
      reviewsByShop,
      loadingByShop,
      getReviews,
      loadReviews,
      addReview,
      toggleLike,
      loadUserReviews,
    }),
    [reviewsByShop, loadingByShop, getReviews, loadReviews, addReview, toggleLike, loadUserReviews]
  );

  return <ReviewsContext.Provider value={value}>{children}</ReviewsContext.Provider>;
}

export function useReviews() {
  const ctx = useContext(ReviewsContext);
  if (!ctx) throw new Error('useReviews must be used within ReviewsProvider');
  return ctx;
}
