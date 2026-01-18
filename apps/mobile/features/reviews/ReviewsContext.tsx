import { AUTH_REQUIRED } from '@team/constants';
import {
  type AuthResolver,
  createDependencyInjector,
  createSafeContext,
  ensureAuthenticated,
} from '@team/core-utils';
import { uploadToSignedUrl } from '@team/file-utils';
import { mapApiReview, useOptimisticMutation, useSafeState } from '@team/hooks';
import React, { useCallback, useMemo, useRef } from 'react';

import { api, type ReviewSort, type UploadFileInput } from '@/lib/api';
import {
  getAccessToken as getAccessTokenApi,
  getCurrentUser as getCurrentUserApi,
  getSupabase as getSupabaseApi,
  resolveAuth as resolveAuthApi,
} from '@/lib/auth';
import { storage } from '@/lib/storage';

import type { Review, ReviewAsset, ReviewFile } from '@team/types';

// テスト可能なSupabaseストレージの最小限のインターフェース
type UploadToSignedUrlResult = { error: Error | null };
type StorageBucket = {
  uploadToSignedUrl: (
    path: string,
    token: string,
    bytes: Uint8Array,
    options: { contentType: string; upsert: boolean },
  ) => Promise<UploadToSignedUrlResult>;
};
type SupabaseStorageClient = {
  storage: {
    from: (bucket: string) => StorageBucket;
  };
};

type ReviewsDependencies = {
  resolveAuth: AuthResolver;
  getAccessToken: typeof getAccessTokenApi;
  getCurrentUser: typeof getCurrentUserApi;
  fetchStoreReviews: typeof api.fetchStoreReviews;
  fetchUserReviews: typeof api.fetchUserReviews;
  createReview: typeof api.createReview;
  createReviewUploads: typeof api.createReviewUploads;
  likeReview: typeof api.likeReview;
  unlikeReview: typeof api.unlikeReview;
  getSupabase: () => SupabaseStorageClient;
};

const dependencyInjector = createDependencyInjector<ReviewsDependencies>({
  resolveAuth: resolveAuthApi,
  getAccessToken: getAccessTokenApi,
  getCurrentUser: getCurrentUserApi,
  fetchStoreReviews: api.fetchStoreReviews,
  fetchUserReviews: api.fetchUserReviews,
  createReview: api.createReview,
  createReviewUploads: api.createReviewUploads,
  likeReview: api.likeReview,
  unlikeReview: api.unlikeReview,
  getSupabase: getSupabaseApi,
});

export const __setReviewsDependenciesForTesting = dependencyInjector.setForTesting;
export const __resetReviewsDependenciesForTesting = dependencyInjector.reset;

export type { Review, ReviewAsset, ReviewFile };

type ReviewsState = Record<string, Review[]>;

type ReviewsContextValue = {
  reviewsByShop: ReviewsState;
  userReviews: Review[];
  loadingByShop: Record<string, boolean>;
  getReviews: (shopId: string) => Review[];
  loadReviews: (shopId: string, sort: ReviewSort) => Promise<void>;
  addReview: (
    shopId: string,
    input: {
      rating: number;
      comment?: string;
      menuItemIds?: string[];
      menuItemName?: string;
    },
    assets: ReviewAsset[],
  ) => Promise<void>;
  deleteReview: (reviewId: string) => void;
  toggleReviewLike: (reviewId: string) => Promise<void>;
  isReviewLiked: (reviewId: string) => boolean;
  getReviewLikesCount: (reviewId: string) => number;
  getLikedReviews: () => Review[];
  toggleLike: (shopId: string, reviewId: string) => Promise<void>;
  loadUserReviews: () => Promise<void>;
};

const [ReviewsContextProvider, useReviews] = createSafeContext<ReviewsContextValue>('Reviews');
export { useReviews };

export function ReviewsProvider({ children }: { children: React.ReactNode }) {
  const [reviewsByShop, setReviewsByShop] = useSafeState<ReviewsState>({});
  const [userReviews, setUserReviews] = useSafeState<Review[]>([]);
  const [loadingByShop, setLoadingByShop] = useSafeState<Record<string, boolean>>({});

  // レースコンディション対策: 最新の reviewsByShop を参照
  const reviewsByShopRef = useRef(reviewsByShop);
  reviewsByShopRef.current = reviewsByShop;

  // 楽観的更新フック（認証は手動でチェック）
  const { execute: executeLikeMutation } = useOptimisticMutation<ReviewsState, string, string>({
    setState: setReviewsByShop,
  });

  const getReviews = useCallback((shopId: string) => reviewsByShop[shopId] ?? [], [reviewsByShop]);

  const loadReviews = useCallback(
    async (shopId: string, sort: ReviewSort) => {
      setLoadingByShop(prev => ({ ...prev, [shopId]: true }));
      try {
        const token = await dependencyInjector.get().getAccessToken();
        const reviews = await dependencyInjector
          .get()
          .fetchStoreReviews(shopId, sort, token ?? undefined);
        setReviewsByShop(prev => ({
          ...prev,
          [shopId]: reviews.map(mapApiReview),
        }));
      } finally {
        setLoadingByShop(prev => ({ ...prev, [shopId]: false }));
      }
    },
    [setLoadingByShop, setReviewsByShop],
  );

  const addReview = useCallback(
    async (
      shopId: string,
      input: {
        rating: number;
        comment?: string;
        menuItemIds?: string[];
        menuItemName?: string;
      },
      assets: ReviewAsset[],
    ) => {
      const token = await dependencyInjector.get().getAccessToken();
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
        const uploadResult = await dependencyInjector
          .get()
          .createReviewUploads(shopId, uploadInputs, token);
        const uploads = uploadResult.files;
        if (uploads.length !== assets.length) {
          throw new Error('upload mismatch');
        }
        await Promise.all(
          uploads.map((upload, index) =>
            uploadToSignedUrl({
              path: upload.path,
              token: upload.token,
              asset: assets[index],
              bucket: dependencyInjector
                .get()
                .getSupabase()
                .storage.from(storage.SUPABASE_STORAGE_BUCKET),
            }),
          ),
        );
        fileIDs = uploads.map(upload => upload.file_id);
      }

      await dependencyInjector.get().createReview(
        shopId,
        {
          rating: input.rating,
          content: input.comment ?? null,
          file_ids: fileIDs,
          menu_ids: input.menuItemIds ?? [],
        },
        token,
      );

      await loadReviews(shopId, 'new');
    },
    [loadReviews],
  );

  const toggleLike = useCallback(
    async (shopId: string, reviewId: string) => {
      // 認証チェック（API呼び出し前に行う）
      const token = await dependencyInjector.get().getAccessToken();
      if (!token) {
        throw new Error(AUTH_REQUIRED);
      }

      // 現在の like 状態を取得（楽観的更新・ロールバック・API呼び出しで使用）
      const currentReviews = reviewsByShopRef.current[shopId] ?? [];
      const targetReview = currentReviews.find(r => r.id === reviewId);
      const wasLiked = targetReview?.likedByMe ?? false;

      await executeLikeMutation({
        key: reviewId,
        optimisticUpdate: prev => {
          const current = prev[shopId] ?? [];
          const next = current.map(review => {
            if (review.id !== reviewId) return review;
            return {
              ...review,
              likedByMe: !review.likedByMe,
              likesCount: review.likesCount + (review.likedByMe ? -1 : 1),
            };
          });
          return { ...prev, [shopId]: next };
        },
        apiCall: async () => {
          if (wasLiked) {
            await dependencyInjector.get().unlikeReview(reviewId, token);
          } else {
            await dependencyInjector.get().likeReview(reviewId, token);
          }
        },
        rollback: prev => {
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
        },
      });
    },
    [executeLikeMutation],
  );

  const deleteReview = useCallback(
    (reviewId: string) => {
      setReviewsByShop(prev => {
        const next: ReviewsState = {};
        Object.entries(prev).forEach(([shopId, reviews]) => {
          const filtered = reviews.filter(review => review.id !== reviewId);
          next[shopId] = filtered;
        });
        return next;
      });
      setUserReviews(prev => prev.filter(review => review.id !== reviewId));
    },
    [setReviewsByShop, setUserReviews],
  );

  const toggleReviewLike = useCallback(
    async (reviewId: string) => {
      let targetShopId: string | null = null;
      Object.entries(reviewsByShop).some(([shopId, reviews]) => {
        if (reviews.some(review => review.id === reviewId)) {
          targetShopId = shopId;
          return true;
        }
        return false;
      });
      if (!targetShopId) return;
      await toggleLike(targetShopId, reviewId);
    },
    [reviewsByShop, toggleLike],
  );

  const isReviewLiked = useCallback(
    (reviewId: string) => {
      const all = Object.values(reviewsByShop).flat();
      const review = all.find(item => item.id === reviewId);
      return review?.likedByMe ?? false;
    },
    [reviewsByShop],
  );

  const getReviewLikesCount = useCallback(
    (reviewId: string) => {
      const all = Object.values(reviewsByShop).flat();
      const review = all.find(item => item.id === reviewId);
      return review?.likesCount ?? 0;
    },
    [reviewsByShop],
  );

  const getLikedReviews = useCallback(() => {
    const all = Object.values(reviewsByShop).flat();
    return all.filter(review => review.likedByMe);
  }, [reviewsByShop]);

  const loadUserReviews = useCallback(async () => {
    const authResult = await ensureAuthenticated(dependencyInjector.get().resolveAuth);
    if (authResult.skipped) return;
    const token = authResult.token!;
    const user = await dependencyInjector.get().getCurrentUser();
    const reviews = await dependencyInjector.get().fetchUserReviews(user!.id, token);
    const mapped = reviews.map(mapApiReview);
    mapped.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    setUserReviews(mapped);
  }, [setUserReviews]);

  const value = useMemo<ReviewsContextValue>(
    () => ({
      reviewsByShop,
      userReviews,
      loadingByShop,
      getReviews,
      loadReviews,
      addReview,
      deleteReview,
      toggleReviewLike,
      isReviewLiked,
      getReviewLikesCount,
      getLikedReviews,
      toggleLike,
      loadUserReviews,
    }),
    [
      reviewsByShop,
      userReviews,
      loadingByShop,
      getReviews,
      loadReviews,
      addReview,
      deleteReview,
      toggleReviewLike,
      isReviewLiked,
      getReviewLikesCount,
      getLikedReviews,
      toggleLike,
      loadUserReviews,
    ],
  );

  return <ReviewsContextProvider value={value}>{children}</ReviewsContextProvider>;
}
