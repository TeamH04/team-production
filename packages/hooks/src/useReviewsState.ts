import { useCallback, useMemo, useRef } from 'react';

import { useOptimisticMutation } from './useOptimisticUpdate';
import { useSafeState } from './useSafeState';

import type { AuthResult } from './useOptimisticUpdate';

/**
 * Review型（フロントエンド用）
 */
export type ReviewItem = {
  id: string;
  shopId: string;
  userId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  menuItemIds?: string[];
  menuItemName?: string;
  likesCount: number;
  likedByMe: boolean;
  files: ReviewFileItem[];
};

export type ReviewFileItem = {
  id: string;
  fileName: string;
  objectKey: string;
  url?: string;
  contentType?: string | null;
};

/**
 * レビュー投稿時の入力
 */
export type ReviewInput = {
  rating: number;
  comment?: string;
  menuItemIds?: string[];
  menuItemName?: string;
};

/**
 * アップロード用アセット情報
 */
export type ReviewAssetInfo = {
  uri: string;
  fileName: string;
  contentType: string;
  fileSize?: number;
};

/**
 * アップロード用ファイル入力
 */
export type UploadFileInputItem = {
  file_name: string;
  file_size?: number;
  content_type: string;
};

/**
 * 署名付きアップロードファイル
 */
export type SignedUploadFileItem = {
  file_id: string;
  object_key: string;
  path: string;
  token: string;
  content_type: string;
};

/**
 * レビュー作成時の入力（API用）
 */
export type CreateReviewInput = {
  rating: number;
  content: string | null;
  file_ids: string[];
  menu_ids: string[];
};

/**
 * ソート種別
 */
export type ReviewSortType = 'new' | 'liked';

/**
 * useReviewsState の API 依存関係
 */
export type ReviewsApiDependencies<TToken = string> = {
  /** 店舗のレビュー一覧を取得 */
  fetchStoreReviews: (
    shopId: string,
    sort: ReviewSortType,
    token?: TToken,
  ) => Promise<ReviewItem[]>;
  /** ユーザーのレビュー一覧を取得 */
  fetchUserReviews: (userId: string, token: TToken) => Promise<ReviewItem[]>;
  /** レビューを作成 */
  createReview: (shopId: string, input: CreateReviewInput, token: TToken) => Promise<void>;
  /** アップロード用署名を取得 */
  createReviewUploads: (
    shopId: string,
    files: UploadFileInputItem[],
    token: TToken,
  ) => Promise<{ files: SignedUploadFileItem[] }>;
  /** レビューにいいね */
  likeReview: (reviewId: string, token: TToken) => Promise<void>;
  /** レビューのいいねを解除 */
  unlikeReview: (reviewId: string, token: TToken) => Promise<void>;
  /** ファイルをストレージにアップロード */
  uploadToStorage: (path: string, token: string, asset: ReviewAssetInfo) => Promise<void>;
};

/**
 * useReviewsState の認証依存関係
 */
export type ReviewsAuthDependencies<TToken = string> = {
  /** 認証を解決（ロードと楽観的更新の両方で使用） */
  resolveAuth: () => Promise<AuthResult<TToken>>;
  /** アクセストークンを取得（null = 未認証） */
  getAccessToken: () => Promise<TToken | null>;
  /** 現在のユーザーIDを取得 */
  getCurrentUserId: () => Promise<string | null>;
};

/**
 * useReviewsState の設定オプション
 */
export type UseReviewsStateOptions<TToken = string> = {
  /** API 依存関係 */
  api: ReviewsApiDependencies<TToken>;
  /** 認証依存関係 */
  auth: ReviewsAuthDependencies<TToken>;
  /** 認証必須エラーメッセージ */
  authRequiredMessage?: string;
};

/**
 * 店舗ごとのレビュー状態
 */
export type ReviewsByShopState = Record<string, ReviewItem[]>;

/**
 * useReviewsState の戻り値
 */
export type UseReviewsStateResult = {
  /** 店舗ごとのレビュー */
  reviewsByShop: ReviewsByShopState;
  /** ユーザーのレビュー */
  userReviews: ReviewItem[];
  /** 店舗ごとのローディング状態 */
  loadingByShop: Record<string, boolean>;
  /** 店舗のレビュー一覧を取得 */
  getReviews: (shopId: string) => ReviewItem[];
  /** 店舗のレビューをロード */
  loadReviews: (shopId: string, sort: ReviewSortType) => Promise<void>;
  /** レビューを追加 */
  addReview: (shopId: string, input: ReviewInput, assets: ReviewAssetInfo[]) => Promise<void>;
  /** レビューを削除（ローカル状態のみ） */
  deleteReview: (reviewId: string) => void;
  /** レビューIDからいいねをトグル */
  toggleReviewLike: (reviewId: string) => Promise<void>;
  /** レビューがいいね済みか判定 */
  isReviewLiked: (reviewId: string) => boolean;
  /** レビューのいいね数を取得 */
  getReviewLikesCount: (reviewId: string) => number;
  /** いいね済みレビュー一覧を取得 */
  getLikedReviews: () => ReviewItem[];
  /** 店舗IDとレビューIDを指定していいねをトグル */
  toggleLike: (shopId: string, reviewId: string) => Promise<void>;
  /** ユーザーのレビューをロード */
  loadUserReviews: () => Promise<void>;
};

const DEFAULT_AUTH_REQUIRED_MESSAGE = 'Authentication required';

/**
 * レビュー状態管理のためのカスタムフック
 *
 * このフックは以下の機能を提供します：
 * - 店舗ごとのレビュー一覧の状態管理
 * - ユーザーレビューの状態管理
 * - 楽観的更新によるいいねの追加/削除
 * - 認証対応
 * - レースコンディション対策
 *
 * @example
 * ```tsx
 * const {
 *   reviewsByShop,
 *   userReviews,
 *   loadingByShop,
 *   getReviews,
 *   loadReviews,
 *   addReview,
 *   deleteReview,
 *   toggleLike,
 *   loadUserReviews,
 * } = useReviewsState({
 *   api: {
 *     fetchStoreReviews: async (shopId, sort, token) => {
 *       const reviews = await api.fetchStoreReviews(shopId, sort, token);
 *       return reviews.map(mapApiReview);
 *     },
 *     fetchUserReviews: async (userId, token) => {
 *       const reviews = await api.fetchUserReviews(userId, token);
 *       return reviews.map(mapApiReview);
 *     },
 *     createReview: (shopId, input, token) => api.createReview(shopId, input, token),
 *     createReviewUploads: (shopId, files, token) => api.createReviewUploads(shopId, files, token),
 *     likeReview: (reviewId, token) => api.likeReview(reviewId, token),
 *     unlikeReview: (reviewId, token) => api.unlikeReview(reviewId, token),
 *     uploadToStorage: (path, token, asset) => uploadToSignedUrl(path, token, asset),
 *   },
 *   auth: {
 *     resolveAuth: async () => {
 *       const result = await ensureAuthenticated(authResolver);
 *       if (result.skipped) return { skipped: true };
 *       return { skipped: false, token: result.token };
 *     },
 *     getAccessToken: () => getAccessToken(),
 *     getCurrentUserId: async () => {
 *       const user = await getCurrentUser();
 *       return user?.id ?? null;
 *     },
 *   },
 * });
 * ```
 */
export function useReviewsState<TToken = string>(
  options: UseReviewsStateOptions<TToken>,
): UseReviewsStateResult {
  const { api, auth, authRequiredMessage = DEFAULT_AUTH_REQUIRED_MESSAGE } = options;

  const [reviewsByShop, setReviewsByShop] = useSafeState<ReviewsByShopState>({});
  const [userReviews, setUserReviews] = useSafeState<ReviewItem[]>([]);
  const [loadingByShop, setLoadingByShop] = useSafeState<Record<string, boolean>>({});

  // レースコンディション対策: 最新の reviewsByShop を参照
  const reviewsByShopRef = useRef(reviewsByShop);
  reviewsByShopRef.current = reviewsByShop;

  // 楽観的更新フック
  const { execute: executeLikeMutation } = useOptimisticMutation<
    ReviewsByShopState,
    string,
    TToken
  >({
    setState: setReviewsByShop,
    resolveAuth: auth.resolveAuth,
  });

  const getReviews = useCallback((shopId: string) => reviewsByShop[shopId] ?? [], [reviewsByShop]);

  const loadReviews = useCallback(
    async (shopId: string, sort: ReviewSortType) => {
      setLoadingByShop(prev => ({ ...prev, [shopId]: true }));
      try {
        const token = await auth.getAccessToken();
        const reviews = await api.fetchStoreReviews(
          shopId,
          sort,
          token ?? (undefined as TToken | undefined),
        );
        setReviewsByShop(prev => ({
          ...prev,
          [shopId]: reviews,
        }));
      } finally {
        setLoadingByShop(prev => ({ ...prev, [shopId]: false }));
      }
    },
    [api, auth, setLoadingByShop, setReviewsByShop],
  );

  const addReview = useCallback(
    async (shopId: string, input: ReviewInput, assets: ReviewAssetInfo[]) => {
      const token = await auth.getAccessToken();
      if (!token) {
        throw new Error(authRequiredMessage);
      }

      let fileIDs: string[] = [];
      if (assets.length > 0) {
        const uploadInputs: UploadFileInputItem[] = assets.map(asset => ({
          file_name: asset.fileName,
          file_size: asset.fileSize,
          content_type: asset.contentType,
        }));
        const uploadResult = await api.createReviewUploads(shopId, uploadInputs, token);
        const uploads = uploadResult.files;
        if (uploads.length !== assets.length) {
          throw new Error('upload mismatch');
        }
        await Promise.all(
          uploads.map((upload, index) =>
            api.uploadToStorage(upload.path, upload.token, assets[index]),
          ),
        );
        fileIDs = uploads.map(upload => upload.file_id);
      }

      await api.createReview(
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
    [api, auth, authRequiredMessage, loadReviews],
  );

  const toggleLike = useCallback(
    async (shopId: string, reviewId: string) => {
      // 現在の like 状態を取得
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
        apiCall: async token => {
          if (wasLiked) {
            await api.unlikeReview(reviewId, token);
          } else {
            await api.likeReview(reviewId, token);
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
    [api, executeLikeMutation],
  );

  const deleteReview = useCallback(
    (reviewId: string) => {
      setReviewsByShop(prev => {
        const next: ReviewsByShopState = {};
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
    const authResult = await auth.resolveAuth();
    if (authResult.skipped) return;
    const token = authResult.token;
    const userId = await auth.getCurrentUserId();
    if (!userId) return;
    const reviews = await api.fetchUserReviews(userId, token);
    const sorted = [...reviews].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    setUserReviews(sorted);
  }, [api, auth, setUserReviews]);

  return useMemo<UseReviewsStateResult>(
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
}
