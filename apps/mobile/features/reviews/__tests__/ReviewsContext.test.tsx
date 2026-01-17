import assert from 'node:assert/strict';
import { afterEach, describe, mock, test } from 'node:test';

import React from 'react';

import { act, createContextHarness, createMockApiReview, type ContextHarness } from '@/test-utils';

import {
  __resetReviewsDependenciesForTesting,
  __setReviewsDependenciesForTesting,
  ReviewsProvider,
  useReviews,
  type ReviewAsset,
} from '../ReviewsContext';

import type { ApiReview } from '@/lib/api';
import type { User } from '@supabase/supabase-js';

type SetupOptions = {
  token?: string | null;
  user?: User | null;
  reviews?: ApiReview[];
  shouldFail?: boolean;
  uploadError?: boolean;
  uploadFileCount?: number;
};

const setupDependencies = (options: SetupOptions = {}) => {
  const {
    token = 'test-token',
    user = { id: 'user-1' } as User,
    reviews = [createMockApiReview('review-1', 'shop-1')],
    shouldFail = false,
    uploadError = false,
    uploadFileCount = 2,
  } = options;

  const getAccessToken = mock.fn(async () => token);
  const getCurrentUser = mock.fn(async () => user);
  const fetchStoreReviews = mock.fn(async () => {
    if (shouldFail) throw new Error('API Error');
    return reviews;
  });
  const fetchUserReviews = mock.fn(async () => {
    if (shouldFail) throw new Error('API Error');
    return reviews;
  });
  const createReview = mock.fn(async () => createMockApiReview('new-review', 'shop-1'));

  const uploadFiles = Array.from({ length: uploadFileCount }, (_, i) => ({
    file_id: `file-${i + 1}`,
    object_key: `reviews/file-${i + 1}.jpg`,
    path: `reviews/file-${i + 1}.jpg`,
    token: `upload-token-${i + 1}`,
    content_type: 'image/jpeg',
  }));
  const createReviewUploads = mock.fn(async () => ({ files: uploadFiles }));
  const likeReview = mock.fn(async () => undefined);
  const unlikeReview = mock.fn(async () => undefined);

  const uploadToSignedUrl = mock.fn(async () => ({
    error: uploadError ? new Error('Upload failed') : null,
  }));

  const getSupabase = mock.fn(() => ({
    storage: {
      from: () => ({
        uploadToSignedUrl,
      }),
    },
  }));

  __setReviewsDependenciesForTesting({
    getAccessToken,
    getCurrentUser,
    fetchStoreReviews,
    fetchUserReviews,
    createReview,
    createReviewUploads,
    likeReview,
    unlikeReview,
    getSupabase,
  });

  return {
    getAccessToken,
    getCurrentUser,
    fetchStoreReviews,
    fetchUserReviews,
    createReview,
    createReviewUploads,
    likeReview,
    unlikeReview,
    uploadToSignedUrl,
    getSupabase,
  };
};

afterEach(() => {
  __resetReviewsDependenciesForTesting();
  mock.restoreAll();
});

describe('ReviewsContext', () => {
  test('useReviews throws outside ReviewsProvider', () => {
    setupDependencies();

    assert.throws(() => {
      createContextHarness(useReviews, ({ children }) => <>{children}</>);
    }, /useReviews must be used within ReviewsProvider/);
  });

  describe('初期状態', () => {
    test('reviewsByShopは空', () => {
      setupDependencies();
      const harness: ContextHarness<ReturnType<typeof useReviews>> = createContextHarness(
        useReviews,
        ReviewsProvider,
      );

      assert.deepEqual(harness.getValue().reviewsByShop, {});
      harness.unmount();
    });
  });

  describe('loadReviews', () => {
    test('レビューを取得する', async () => {
      const mockReviews = [
        createMockApiReview('r1', 'shop-1'),
        createMockApiReview('r2', 'shop-1'),
      ];
      const { fetchStoreReviews } = setupDependencies({ reviews: mockReviews });
      const harness: ContextHarness<ReturnType<typeof useReviews>> = createContextHarness(
        useReviews,
        ReviewsProvider,
      );

      await act(async () => {
        await harness.getValue().loadReviews('shop-1', 'new');
      });

      assert.equal(fetchStoreReviews.mock.calls.length, 1);
      assert.equal(harness.getValue().reviewsByShop['shop-1']?.length, 2);
      harness.unmount();
    });

    test('loadingByShop が更新される', async () => {
      setupDependencies();
      const harness: ContextHarness<ReturnType<typeof useReviews>> = createContextHarness(
        useReviews,
        ReviewsProvider,
      );

      const loadPromise = act(async () => {
        await harness.getValue().loadReviews('shop-1', 'new');
      });

      await loadPromise;

      assert.equal(harness.getValue().loadingByShop['shop-1'], false);
      harness.unmount();
    });
  });

  describe('getReviews', () => {
    test('店舗のレビューを取得する', async () => {
      const mockReviews = [createMockApiReview('r1', 'shop-1')];
      setupDependencies({ reviews: mockReviews });
      const harness: ContextHarness<ReturnType<typeof useReviews>> = createContextHarness(
        useReviews,
        ReviewsProvider,
      );

      await act(async () => {
        await harness.getValue().loadReviews('shop-1', 'new');
      });

      const reviews = harness.getValue().getReviews('shop-1');
      assert.equal(reviews.length, 1);
      assert.equal(reviews[0].id, 'r1');
      harness.unmount();
    });

    test('存在しない店舗は空配列を返す', () => {
      setupDependencies();
      const harness: ContextHarness<ReturnType<typeof useReviews>> = createContextHarness(
        useReviews,
        ReviewsProvider,
      );

      const reviews = harness.getValue().getReviews('non-existent');
      assert.deepEqual(reviews, []);
      harness.unmount();
    });
  });

  describe('addReview', () => {
    test('未認証時にauth_requiredエラー', async () => {
      setupDependencies({ token: null });
      const harness: ContextHarness<ReturnType<typeof useReviews>> = createContextHarness(
        useReviews,
        ReviewsProvider,
      );

      await assert.rejects(
        async () => {
          await act(async () => {
            await harness.getValue().addReview('shop-1', { rating: 5 }, []);
          });
        },
        (err: unknown) => err instanceof Error && err.message === 'auth_required',
      );

      harness.unmount();
    });

    test('レビューを追加後にloadReviewsが呼ばれる', async () => {
      const { createReview, fetchStoreReviews } = setupDependencies();
      const harness: ContextHarness<ReturnType<typeof useReviews>> = createContextHarness(
        useReviews,
        ReviewsProvider,
      );

      await act(async () => {
        await harness.getValue().addReview('shop-1', { rating: 5, comment: 'Great!' }, []);
      });

      assert.equal(createReview.mock.calls.length, 1);
      assert.equal(fetchStoreReviews.mock.calls.length, 1);
      harness.unmount();
    });

    test('ファイルアップロードが実行される', async () => {
      const { createReviewUploads, createReview, getSupabase } = setupDependencies();
      const harness: ContextHarness<ReturnType<typeof useReviews>> = createContextHarness(
        useReviews,
        ReviewsProvider,
      );

      // fetch をモック（ReviewAssetのURIからデータを取得するため）
      const originalFetch = globalThis.fetch;
      globalThis.fetch = mock.fn(async () => ({
        arrayBuffer: async () => new ArrayBuffer(100),
      })) as unknown as typeof fetch;

      try {
        const assets: ReviewAsset[] = [
          { uri: 'file://image1.jpg', fileName: 'image1.jpg', contentType: 'image/jpeg' },
          { uri: 'file://image2.jpg', fileName: 'image2.jpg', contentType: 'image/jpeg' },
        ];

        await act(async () => {
          await harness.getValue().addReview('shop-1', { rating: 5 }, assets);
        });

        // createReviewUploadsが呼ばれる
        assert.equal(createReviewUploads.mock.calls.length, 1);
        const uploadCalls = createReviewUploads.mock.calls as unknown as { arguments: unknown[] }[];
        const uploadInput = uploadCalls[0].arguments;
        assert.equal(uploadInput[0], 'shop-1');
        assert.equal((uploadInput[1] as unknown[]).length, 2);

        // getSupabaseが呼ばれる（アップロード用）
        assert.ok(getSupabase.mock.calls.length >= 1);

        // createReviewが正しいfile_idsで呼ばれる
        assert.equal(createReview.mock.calls.length, 1);
        const reviewCalls = createReview.mock.calls as unknown as { arguments: unknown[] }[];
        const reviewInput = reviewCalls[0].arguments[1] as { file_ids?: string[] };
        assert.deepEqual(reviewInput.file_ids, ['file-1', 'file-2']);
      } finally {
        globalThis.fetch = originalFetch;
      }

      harness.unmount();
    });

    test('ファイルアップロード失敗時にエラーがスローされる', async () => {
      setupDependencies({ uploadError: true, uploadFileCount: 1 });
      const harness: ContextHarness<ReturnType<typeof useReviews>> = createContextHarness(
        useReviews,
        ReviewsProvider,
      );

      const originalFetch = globalThis.fetch;
      globalThis.fetch = mock.fn(async () => ({
        arrayBuffer: async () => new ArrayBuffer(100),
      })) as unknown as typeof fetch;

      try {
        const assets: ReviewAsset[] = [
          { uri: 'file://image1.jpg', fileName: 'image1.jpg', contentType: 'image/jpeg' },
        ];

        await assert.rejects(
          async () => {
            await act(async () => {
              await harness.getValue().addReview('shop-1', { rating: 5 }, assets);
            });
          },
          (err: unknown) => err instanceof Error && err.message === 'upload failed',
        );
      } finally {
        globalThis.fetch = originalFetch;
      }

      harness.unmount();
    });
  });

  describe('toggleLike', () => {
    test('楽観的更新される', async () => {
      const mockReviews = [
        createMockApiReview('r1', 'shop-1', {
          liked_by_me: false,
          likes_count: 5,
        }),
      ];
      setupDependencies({ reviews: mockReviews });
      const harness: ContextHarness<ReturnType<typeof useReviews>> = createContextHarness(
        useReviews,
        ReviewsProvider,
      );

      await act(async () => {
        await harness.getValue().loadReviews('shop-1', 'new');
      });

      await act(async () => {
        await harness.getValue().toggleLike('shop-1', 'r1');
      });

      const review = harness.getValue().reviewsByShop['shop-1']?.[0];
      assert.equal(review?.likedByMe, true);
      assert.equal(review?.likesCount, 6);
      harness.unmount();
    });

    test('未認証時にauth_requiredエラー', async () => {
      setupDependencies({ token: null });
      const harness: ContextHarness<ReturnType<typeof useReviews>> = createContextHarness(
        useReviews,
        ReviewsProvider,
      );

      await assert.rejects(
        async () => {
          await act(async () => {
            await harness.getValue().toggleLike('shop-1', 'r1');
          });
        },
        (err: unknown) => err instanceof Error && err.message === 'auth_required',
      );

      harness.unmount();
    });

    test('APIエラー時にロールバックされる', async () => {
      const mockReviews = [
        createMockApiReview('r1', 'shop-1', {
          liked_by_me: false,
          likes_count: 5,
        }),
      ];
      const { likeReview } = setupDependencies({ reviews: mockReviews });
      likeReview.mock.mockImplementation(async () => {
        throw new Error('API Error');
      });
      const harness: ContextHarness<ReturnType<typeof useReviews>> = createContextHarness(
        useReviews,
        ReviewsProvider,
      );

      await act(async () => {
        await harness.getValue().loadReviews('shop-1', 'new');
      });

      await assert.rejects(async () => {
        await act(async () => {
          await harness.getValue().toggleLike('shop-1', 'r1');
        });
      });

      const review = harness.getValue().reviewsByShop['shop-1']?.[0];
      assert.equal(review?.likedByMe, false);
      assert.equal(review?.likesCount, 5);
      harness.unmount();
    });
  });

  describe('deleteReview', () => {
    test('reviewsByShopから削除される', async () => {
      const mockReviews = [
        createMockApiReview('r1', 'shop-1'),
        createMockApiReview('r2', 'shop-1'),
      ];
      setupDependencies({ reviews: mockReviews });
      const harness: ContextHarness<ReturnType<typeof useReviews>> = createContextHarness(
        useReviews,
        ReviewsProvider,
      );

      await act(async () => {
        await harness.getValue().loadReviews('shop-1', 'new');
      });

      await act(async () => {
        harness.getValue().deleteReview('r1');
      });

      const reviews = harness.getValue().reviewsByShop['shop-1'];
      assert.equal(reviews?.length, 1);
      assert.equal(reviews?.[0].id, 'r2');
      harness.unmount();
    });

    test('userReviewsから削除される', async () => {
      const mockReviews = [
        createMockApiReview('r1', 'shop-1', {
          created_at: '2025-01-02T00:00:00.000Z',
        }),
        createMockApiReview('r2', 'shop-2', {
          created_at: '2025-01-01T00:00:00.000Z',
        }),
      ];
      setupDependencies({ reviews: mockReviews });
      const harness: ContextHarness<ReturnType<typeof useReviews>> = createContextHarness(
        useReviews,
        ReviewsProvider,
      );

      await act(async () => {
        await harness.getValue().loadUserReviews();
      });

      await act(async () => {
        harness.getValue().deleteReview('r1');
      });

      assert.equal(harness.getValue().userReviews.length, 1);
      assert.equal(harness.getValue().userReviews[0].id, 'r2');
      harness.unmount();
    });
  });

  describe('loadUserReviews', () => {
    test('未認証時にauth_requiredエラー', async () => {
      setupDependencies({ user: null });
      const harness: ContextHarness<ReturnType<typeof useReviews>> = createContextHarness(
        useReviews,
        ReviewsProvider,
      );

      await assert.rejects(
        async () => {
          await act(async () => {
            await harness.getValue().loadUserReviews();
          });
        },
        (err: unknown) => err instanceof Error && err.message === 'auth_required',
      );

      harness.unmount();
    });

    test('ユーザーのレビューを取得する', async () => {
      const mockReviews = [
        createMockApiReview('r1', 'shop-1', {
          created_at: '2025-01-02T00:00:00.000Z',
        }),
        createMockApiReview('r2', 'shop-2', {
          created_at: '2025-01-01T00:00:00.000Z',
        }),
      ];
      const { fetchUserReviews } = setupDependencies({ reviews: mockReviews });
      const harness: ContextHarness<ReturnType<typeof useReviews>> = createContextHarness(
        useReviews,
        ReviewsProvider,
      );

      await act(async () => {
        await harness.getValue().loadUserReviews();
      });

      assert.equal(fetchUserReviews.mock.calls.length, 1);
      assert.equal(harness.getValue().userReviews.length, 2);
      assert.equal(harness.getValue().userReviews[0].id, 'r1');
      harness.unmount();
    });
  });

  describe('いいね関連ヘルパー', () => {
    test('isReviewLiked でいいね状態を確認できる', async () => {
      const mockReviews = [createMockApiReview('r1', 'shop-1', { liked_by_me: true })];
      setupDependencies({ reviews: mockReviews });
      const harness: ContextHarness<ReturnType<typeof useReviews>> = createContextHarness(
        useReviews,
        ReviewsProvider,
      );

      await act(async () => {
        await harness.getValue().loadReviews('shop-1', 'new');
      });

      assert.equal(harness.getValue().isReviewLiked('r1'), true);
      assert.equal(harness.getValue().isReviewLiked('non-existent'), false);
      harness.unmount();
    });

    test('getReviewLikesCount でいいね数を取得できる', async () => {
      const mockReviews = [createMockApiReview('r1', 'shop-1', { likes_count: 10 })];
      setupDependencies({ reviews: mockReviews });
      const harness: ContextHarness<ReturnType<typeof useReviews>> = createContextHarness(
        useReviews,
        ReviewsProvider,
      );

      await act(async () => {
        await harness.getValue().loadReviews('shop-1', 'new');
      });

      assert.equal(harness.getValue().getReviewLikesCount('r1'), 10);
      assert.equal(harness.getValue().getReviewLikesCount('non-existent'), 0);
      harness.unmount();
    });

    test('getLikedReviews でいいねしたレビュー一覧を取得できる', async () => {
      const mockReviews = [
        createMockApiReview('r1', 'shop-1', { liked_by_me: true }),
        createMockApiReview('r2', 'shop-1', { liked_by_me: false }),
      ];
      setupDependencies({ reviews: mockReviews });
      const harness: ContextHarness<ReturnType<typeof useReviews>> = createContextHarness(
        useReviews,
        ReviewsProvider,
      );

      await act(async () => {
        await harness.getValue().loadReviews('shop-1', 'new');
      });

      const likedReviews = harness.getValue().getLikedReviews();
      assert.equal(likedReviews.length, 1);
      assert.equal(likedReviews[0].id, 'r1');
      harness.unmount();
    });
  });
});
