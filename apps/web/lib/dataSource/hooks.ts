'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { dataSource } from './index';

import type { CreateReviewInput } from './types';
import type { ReviewSort, ReviewWithUser, Shop } from '@team/types';
import type { Dispatch, SetStateAction } from 'react';

// =============================================================================
// Generic Async Data Hook
// =============================================================================

type UseAsyncDataOptions<T> = {
  initialValue: T;
  deps?: unknown[];
  errorMessage: string;
};

type UseAsyncDataResult<T> = {
  data: T;
  setData: Dispatch<SetStateAction<T>>;
  loading: boolean;
  error: Error | null;
  setError: Dispatch<SetStateAction<Error | null>>;
  reload: () => Promise<void>;
};

/**
 * 非同期データ取得の共通パターンを抽出した汎用フック
 */
function useAsyncData<T>(
  fetcher: () => Promise<T>,
  options: UseAsyncDataOptions<T>,
): UseAsyncDataResult<T> {
  const { initialValue, deps = [], errorMessage } = options;
  const [data, setData] = useState<T>(initialValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(errorMessage));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    let cancelled = false;

    const loadWithCleanup = async () => {
      setLoading(true);
      try {
        const result = await fetcher();
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e : new Error(errorMessage));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadWithCleanup();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, setData, loading, error, setError, reload };
}

// =============================================================================
// Error Messages
// =============================================================================

const ERROR_MESSAGES = {
  FETCH_SHOPS: '店舗データの取得に失敗しました',
  FETCH_REVIEWS: 'レビューの取得に失敗しました',
  CREATE_REVIEW: 'レビューの投稿に失敗しました',
  TOGGLE_LIKE: 'いいねの切り替えに失敗しました',
  FETCH_FAVORITES: 'お気に入りの取得に失敗しました',
  TOGGLE_FAVORITE: 'お気に入りの切り替えに失敗しました',
} as const;

// =============================================================================
// Shop Hooks
// =============================================================================

export type UseShopsResult = {
  shops: Shop[];
  loading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
};

/**
 * 全店舗データを取得するフック
 */
export function useShops(): UseShopsResult {
  const {
    data: shops,
    loading,
    error,
    reload,
  } = useAsyncData(() => dataSource.shops.getAll(), {
    initialValue: [] as Shop[],
    errorMessage: ERROR_MESSAGES.FETCH_SHOPS,
  });

  return { shops, loading, error, reload };
}

export type UseShopResult = {
  shop: Shop | undefined;
  loading: boolean;
  error: Error | null;
};

/**
 * IDで店舗を取得するフック
 */
export function useShop(id: string): UseShopResult {
  const {
    data: shop,
    loading,
    error,
  } = useAsyncData(() => dataSource.shops.getById(id), {
    initialValue: undefined as Shop | undefined,
    deps: [id],
    errorMessage: ERROR_MESSAGES.FETCH_SHOPS,
  });

  return { shop, loading, error };
}

// =============================================================================
// Review Hooks
// =============================================================================

export type UseShopReviewsResult = {
  reviews: ReviewWithUser[];
  loading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
  addReview: (input: CreateReviewInput) => Promise<ReviewWithUser>;
  toggleLike: (reviewId: string, currentlyLiked: boolean) => Promise<void>;
};

/**
 * 店舗のレビューを取得するフック
 */
export function useShopReviews(shopId: string, sort?: ReviewSort): UseShopReviewsResult {
  const {
    data: reviews,
    setData: setReviews,
    loading,
    error,
    setError,
    reload,
  } = useAsyncData(() => dataSource.reviews.getByShopId(shopId, sort), {
    initialValue: [] as ReviewWithUser[],
    deps: [shopId, sort],
    errorMessage: ERROR_MESSAGES.FETCH_REVIEWS,
  });

  const addReview = useCallback(
    async (input: CreateReviewInput): Promise<ReviewWithUser> => {
      try {
        const newReview = await dataSource.reviews.create(input);
        setReviews(prev => [newReview, ...prev]);
        return newReview;
      } catch (e) {
        const error = e instanceof Error ? e : new Error(ERROR_MESSAGES.CREATE_REVIEW);
        setError(error);
        throw error;
      }
    },
    [setReviews, setError],
  );

  const toggleLike = useCallback(
    async (reviewId: string, currentlyLiked: boolean) => {
      // 楽観的更新
      setReviews(prev =>
        prev.map(r =>
          r.id === reviewId
            ? {
                ...r,
                likedByMe: !currentlyLiked,
                likesCount: r.likesCount + (currentlyLiked ? -1 : 1),
              }
            : r,
        ),
      );

      try {
        await dataSource.reviews.toggleLike(reviewId, currentlyLiked);
      } catch (e) {
        // ロールバック
        setReviews(prev =>
          prev.map(r =>
            r.id === reviewId
              ? {
                  ...r,
                  likedByMe: currentlyLiked,
                  likesCount: r.likesCount + (currentlyLiked ? 1 : -1),
                }
              : r,
          ),
        );
        setError(e instanceof Error ? e : new Error(ERROR_MESSAGES.TOGGLE_LIKE));
      }
    },
    [setReviews, setError],
  );

  return { reviews, loading, error, reload, addReview, toggleLike };
}

export type UseUserReviewsResult = {
  reviews: ReviewWithUser[];
  loading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
};

/**
 * ユーザーのレビューを取得するフック
 */
export function useUserReviews(userId: string): UseUserReviewsResult {
  const {
    data: reviews,
    loading,
    error,
    reload,
  } = useAsyncData(() => dataSource.reviews.getByUserId(userId), {
    initialValue: [] as ReviewWithUser[],
    deps: [userId],
    errorMessage: ERROR_MESSAGES.FETCH_REVIEWS,
  });

  return { reviews, loading, error, reload };
}

// =============================================================================
// Favorites Hooks
// =============================================================================

export type UseFavoritesResult = {
  favoriteIds: string[];
  loading: boolean;
  error: Error | null;
  isFavorite: (shopId: string) => boolean;
  toggleFavorite: (shopId: string) => Promise<void>;
  reload: () => Promise<void>;
};

/**
 * お気に入り管理フック
 */
export function useFavorites(): UseFavoritesResult {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const ids = await dataSource.favorites.getIds();
      setFavoriteIds(ids);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(ERROR_MESSAGES.FETCH_FAVORITES));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadWithCleanup = async () => {
      setLoading(true);
      try {
        const ids = await dataSource.favorites.getIds();
        if (!cancelled) {
          setFavoriteIds(ids);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e : new Error(ERROR_MESSAGES.FETCH_FAVORITES));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadWithCleanup();

    return () => {
      cancelled = true;
    };
  }, []);

  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  const isFavorite = useCallback(
    (shopId: string): boolean => {
      return favoriteSet.has(shopId);
    },
    [favoriteSet],
  );

  const toggleFavorite = useCallback(
    async (shopId: string) => {
      const isCurrentlyFavorite = favoriteSet.has(shopId);

      // 楽観的更新
      if (isCurrentlyFavorite) {
        setFavoriteIds(prev => prev.filter(id => id !== shopId));
      } else {
        setFavoriteIds(prev => [...prev, shopId]);
      }

      try {
        if (isCurrentlyFavorite) {
          await dataSource.favorites.remove(shopId);
        } else {
          await dataSource.favorites.add(shopId);
        }
      } catch (e) {
        // ロールバック
        if (isCurrentlyFavorite) {
          setFavoriteIds(prev => [...prev, shopId]);
        } else {
          setFavoriteIds(prev => prev.filter(id => id !== shopId));
        }
        setError(e instanceof Error ? e : new Error(ERROR_MESSAGES.TOGGLE_FAVORITE));
      }
    },
    [favoriteSet],
  );

  return { favoriteIds, loading, error, isFavorite, toggleFavorite, reload: load };
}

// =============================================================================
// Combined Hooks
// =============================================================================

export type UseFavoriteShopsResult = {
  shops: Shop[];
  favoriteIds: string[];
  loading: boolean;
  error: Error | null;
  toggleFavorite: (shopId: string) => Promise<void>;
  reload: () => Promise<void>;
};

/**
 * お気に入り店舗の一覧を取得するフック
 */
export function useFavoriteShops(): UseFavoriteShopsResult {
  const {
    shops: allShops,
    loading: shopsLoading,
    error: shopsError,
    reload: reloadShops,
  } = useShops();
  const {
    favoriteIds,
    loading: favoritesLoading,
    error: favoritesError,
    toggleFavorite,
    reload: reloadFavorites,
  } = useFavorites();

  const favoriteShops = useMemo(
    () => allShops.filter(shop => favoriteIds.includes(shop.id)),
    [allShops, favoriteIds],
  );
  const loading = shopsLoading || favoritesLoading;
  const error = shopsError || favoritesError;

  const reload = useCallback(async () => {
    await Promise.all([reloadShops(), reloadFavorites()]);
  }, [reloadShops, reloadFavorites]);

  return {
    shops: favoriteShops,
    favoriteIds,
    loading,
    error,
    toggleFavorite,
    reload,
  };
}
