import { createMockReviewWithUser, createMockShop } from '@team/test-utils';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import type { ReviewWithUser, Shop } from '@team/types';

// モックデータソース
const mockShops: Shop[] = [
  createMockShop({ id: 'shop-1', name: 'カフェA' }),
  createMockShop({ id: 'shop-2', name: 'カフェB' }),
];

const mockReviews: ReviewWithUser[] = [
  createMockReviewWithUser({ id: 'review-1', shopId: 'shop-1', userId: 'user-1' }),
  createMockReviewWithUser({ id: 'review-2', shopId: 'shop-1', userId: 'user-2' }),
];

const mockDataSource = {
  shops: {
    getAll: vi.fn().mockResolvedValue(mockShops),
    getById: vi
      .fn()
      .mockImplementation((id: string) => Promise.resolve(mockShops.find(s => s.id === id))),
  },
  reviews: {
    getByShopId: vi.fn().mockResolvedValue(mockReviews),
    getByUserId: vi.fn().mockResolvedValue(mockReviews),
    create: vi.fn().mockImplementation(input =>
      Promise.resolve(
        createMockReviewWithUser({
          id: 'new-review',
          shopId: input.shopId,
          rating: input.rating,
          comment: input.comment,
        }),
      ),
    ),
    toggleLike: vi.fn().mockResolvedValue(undefined),
  },
  favorites: {
    getIds: vi.fn().mockResolvedValue(['shop-1']),
    add: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
  },
};

vi.mock('../index', () => ({
  dataSource: mockDataSource,
}));

// 動的にhooksをインポート（モックの後に行う必要がある）
const { useFavorites, useFavoriteShops, useShop, useShopReviews, useShops, useUserReviews } =
  await import('../hooks');

describe('useShops', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('店舗一覧を取得できる', async () => {
    const { result } = renderHook(() => useShops());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.shops).toEqual(mockShops);
    expect(result.current.error).toBeNull();
  });

  test('ローディング状態が正しく管理される', async () => {
    const { result } = renderHook(() => useShops());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  test('エラー時にerrorが設定される', async () => {
    mockDataSource.shops.getAll.mockRejectedValueOnce(new Error('取得失敗'));

    const { result } = renderHook(() => useShops());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
  });

  test('reloadで再取得できる', async () => {
    const { result } = renderHook(() => useShops());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockDataSource.shops.getAll).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.reload();
    });

    expect(mockDataSource.shops.getAll).toHaveBeenCalledTimes(2);
  });
});

describe('useShop', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('IDで店舗を取得できる', async () => {
    const { result } = renderHook(() => useShop('shop-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.shop).toEqual(mockShops[0]);
    expect(result.current.error).toBeNull();
  });

  test('存在しないIDの場合undefinedが返る', async () => {
    mockDataSource.shops.getById.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useShop('non-existent'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.shop).toBeUndefined();
  });
});

describe('useShopReviews', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('店舗のレビューを取得できる', async () => {
    const { result } = renderHook(() => useShopReviews('shop-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.reviews).toEqual(mockReviews);
  });

  test('addReviewでレビューを追加できる', async () => {
    const { result } = renderHook(() => useShopReviews('shop-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const newReview = await act(async () => {
      return result.current.addReview({
        shopId: 'shop-1',
        rating: 5,
        comment: '最高でした',
      });
    });

    expect(newReview.rating).toBe(5);
    expect(mockDataSource.reviews.create).toHaveBeenCalled();
  });

  test('toggleLikeで楽観的更新される', async () => {
    const { result } = renderHook(() => useShopReviews('shop-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const initialLiked = result.current.reviews[0].likedByMe;

    await act(async () => {
      await result.current.toggleLike('review-1', initialLiked);
    });

    // 楽観的更新でlikedByMeが反転している
    expect(result.current.reviews[0].likedByMe).toBe(!initialLiked);
  });

  test('toggleLike失敗時にロールバックされる', async () => {
    mockDataSource.reviews.toggleLike.mockRejectedValueOnce(new Error('失敗'));

    const { result } = renderHook(() => useShopReviews('shop-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const initialLiked = result.current.reviews[0].likedByMe;

    await act(async () => {
      await result.current.toggleLike('review-1', initialLiked);
    });

    // ロールバックで元の状態に戻る
    expect(result.current.reviews[0].likedByMe).toBe(initialLiked);
  });
});

describe('useUserReviews', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('ユーザーのレビューを取得できる', async () => {
    const { result } = renderHook(() => useUserReviews('user-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.reviews).toEqual(mockReviews);
  });

  test('reloadで再取得できる', async () => {
    const { result } = renderHook(() => useUserReviews('user-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.reload();
    });

    expect(mockDataSource.reviews.getByUserId).toHaveBeenCalledTimes(2);
  });
});

describe('useFavorites', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDataSource.favorites.getIds.mockResolvedValue(['shop-1']);
  });

  test('お気に入りIDを取得できる', async () => {
    const { result } = renderHook(() => useFavorites());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.favoriteIds).toEqual(['shop-1']);
  });

  test('isFavoriteで判定できる', async () => {
    const { result } = renderHook(() => useFavorites());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isFavorite('shop-1')).toBe(true);
    expect(result.current.isFavorite('shop-2')).toBe(false);
  });

  test('toggleFavoriteで追加できる', async () => {
    const { result } = renderHook(() => useFavorites());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.toggleFavorite('shop-2');
    });

    // 楽観的更新でshop-2が追加される
    expect(result.current.favoriteIds).toContain('shop-2');
    expect(mockDataSource.favorites.add).toHaveBeenCalledWith('shop-2');
  });

  test('toggleFavoriteで削除できる', async () => {
    const { result } = renderHook(() => useFavorites());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.toggleFavorite('shop-1');
    });

    // 楽観的更新でshop-1が削除される
    expect(result.current.favoriteIds).not.toContain('shop-1');
    expect(mockDataSource.favorites.remove).toHaveBeenCalledWith('shop-1');
  });

  test('toggleFavorite失敗時にロールバックされる', async () => {
    mockDataSource.favorites.add.mockRejectedValueOnce(new Error('失敗'));

    const { result } = renderHook(() => useFavorites());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.toggleFavorite('shop-2');
    });

    // ロールバックでshop-2は含まれない
    expect(result.current.favoriteIds).not.toContain('shop-2');
  });
});

describe('useFavoriteShops', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDataSource.favorites.getIds.mockResolvedValue(['shop-1']);
  });

  test('お気に入り店舗を取得できる', async () => {
    const { result } = renderHook(() => useFavoriteShops());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.shops).toHaveLength(1);
    expect(result.current.shops[0].id).toBe('shop-1');
  });

  test('お気に入りIDも取得できる', async () => {
    const { result } = renderHook(() => useFavoriteShops());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.favoriteIds).toEqual(['shop-1']);
  });

  test('reloadで両方再取得される', async () => {
    const { result } = renderHook(() => useFavoriteShops());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.reload();
    });

    expect(mockDataSource.shops.getAll).toHaveBeenCalled();
    expect(mockDataSource.favorites.getIds).toHaveBeenCalled();
  });
});
