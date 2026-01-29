import { DEMO_USER, STORAGE_KEYS } from '@team/constants';
import { CATEGORIES, SHOPS } from '@team/shop-core';

import type { CreateReviewInput, DataSource } from './types';
import type { RatingDetails, ReviewWithUser, Shop } from '@team/types';

// =============================================================================
// Mock Review Generation
// =============================================================================

const MOCK_REVIEW_TEMPLATES: ReadonlyArray<{
  comment: string;
  rating: number;
  ratingDetails: RatingDetails;
}> = [
  {
    comment: 'とても美味しかったです！雰囲気も良くてまた来たいと思います。',
    rating: 5,
    ratingDetails: { taste: 5, atmosphere: 5, service: 4, speed: 4, cleanliness: 5 },
  },
  {
    comment: '料理の味は良かったですが、少し混んでいて待ち時間がありました。',
    rating: 4,
    ratingDetails: { taste: 5, atmosphere: 4, service: 4, speed: 3, cleanliness: 4 },
  },
  {
    comment: '落ち着いた雰囲気で作業するのにぴったりでした。Wi-Fiも快適です。',
    rating: 4,
    ratingDetails: { taste: 4, atmosphere: 5, service: 4, speed: 4, cleanliness: 5 },
  },
];

const MOCK_USER_NAMES: readonly string[] = ['田中さん', '山田さん', '鈴木さん'];
const MOCK_BASE_DATE = '2025-01-01';

function generateMockReviews(shopId: string, count: number): ReviewWithUser[] {
  const reviews: ReviewWithUser[] = [];
  const baseDateObj = new Date(MOCK_BASE_DATE);

  for (let i = 0; i < count; i++) {
    const template = MOCK_REVIEW_TEMPLATES[i % MOCK_REVIEW_TEMPLATES.length];
    const userName = MOCK_USER_NAMES[i % MOCK_USER_NAMES.length];
    const reviewDate = new Date(baseDateObj);
    reviewDate.setDate(reviewDate.getDate() - i * 3);

    reviews.push({
      id: `mock-review-${shopId}-${i}`,
      shopId,
      userId: `mock-user-${i}`,
      userName,
      rating: template.rating,
      ratingDetails: template.ratingDetails,
      comment: template.comment,
      createdAt: reviewDate.toISOString(),
      likesCount: Math.floor(Math.random() * 10),
      likedByMe: false,
    });
  }

  return reviews;
}

// シードレビューデータ（バックエンドのマイグレーションと一致）
const SEED_REVIEWS: ReviewWithUser[] = [
  {
    id: '33333333-3333-3333-3333-333333333333',
    shopId: 'shop-1',
    userId: DEMO_USER.id,
    userName: DEMO_USER.name,
    rating: 5,
    ratingDetails: { taste: 5, atmosphere: 5, service: 4, speed: 4, cleanliness: 5 },
    comment: '朝の時間にぴったりの一杯。コーヒーとシナモンロールの相性が最高でした。',
    createdAt: '2025-01-15T09:00:00.000Z',
    likesCount: 3,
    likedByMe: false,
  },
];

// 店舗ごとのモックレビュー
const MOCK_REVIEWS: Record<string, ReviewWithUser[]> = {
  'shop-1': SEED_REVIEWS.filter(r => r.shopId === 'shop-1'),
  ...Object.fromEntries(
    SHOPS.filter(shop => shop.id !== 'shop-1').map(shop => [
      shop.id,
      generateMockReviews(shop.id, 3),
    ]),
  ),
};

// =============================================================================
// LocalStorage Helpers
// =============================================================================

const STORAGE_KEY_USER_REVIEWS = 'team-user-reviews';
const STORAGE_KEY_FAVORITES = STORAGE_KEYS.FAVORITES;
const STORAGE_KEY_LIKED_REVIEWS = 'team-liked-reviews';

function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

// =============================================================================
// Mock Data Source Implementation
// =============================================================================

export function createMockDataSource(): DataSource {
  return {
    shops: {
      getAll: async (): Promise<Shop[]> => {
        return SHOPS;
      },

      getById: async (id: string): Promise<Shop | undefined> => {
        return SHOPS.find(shop => shop.id === id);
      },

      getCategories: async (): Promise<string[]> => {
        return [...CATEGORIES].sort();
      },
    },

    reviews: {
      getByShopId: async (shopId: string): Promise<ReviewWithUser[]> => {
        const userReviews = getFromStorage<ReviewWithUser[]>(STORAGE_KEY_USER_REVIEWS, []).filter(
          r => r.shopId === shopId,
        );
        const mockReviews = MOCK_REVIEWS[shopId] ?? [];
        const likedReviewIds = getFromStorage<string[]>(STORAGE_KEY_LIKED_REVIEWS, []);

        // いいね状態を反映
        const allReviews = [...userReviews, ...mockReviews].map(review => ({
          ...review,
          likedByMe: likedReviewIds.includes(review.id),
        }));

        // 新しい順にソート
        return allReviews.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      },

      getByUserId: async (): Promise<ReviewWithUser[]> => {
        const userReviews = getFromStorage<ReviewWithUser[]>(STORAGE_KEY_USER_REVIEWS, []);
        const likedReviewIds = getFromStorage<string[]>(STORAGE_KEY_LIKED_REVIEWS, []);

        return userReviews
          .map(review => ({
            ...review,
            likedByMe: likedReviewIds.includes(review.id),
          }))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },

      create: async (input: CreateReviewInput): Promise<ReviewWithUser> => {
        const review: ReviewWithUser = {
          id: `user-review-${Date.now()}`,
          shopId: input.shopId,
          userId: DEMO_USER.id,
          userName: DEMO_USER.name,
          rating: input.rating,
          ratingDetails: input.ratingDetails,
          comment: input.comment,
          createdAt: new Date().toISOString(),
          likesCount: 0,
          likedByMe: false,
        };

        const reviews = getFromStorage<ReviewWithUser[]>(STORAGE_KEY_USER_REVIEWS, []);
        reviews.unshift(review);
        setToStorage(STORAGE_KEY_USER_REVIEWS, reviews);

        return review;
      },

      toggleLike: async (reviewId: string, currentlyLiked: boolean): Promise<void> => {
        const likedReviewIds = getFromStorage<string[]>(STORAGE_KEY_LIKED_REVIEWS, []);

        if (currentlyLiked) {
          // いいね解除
          const newIds = likedReviewIds.filter(id => id !== reviewId);
          setToStorage(STORAGE_KEY_LIKED_REVIEWS, newIds);
        } else {
          // いいね追加
          if (!likedReviewIds.includes(reviewId)) {
            likedReviewIds.push(reviewId);
            setToStorage(STORAGE_KEY_LIKED_REVIEWS, likedReviewIds);
          }
        }
      },
    },

    favorites: {
      getIds: async (): Promise<string[]> => {
        return getFromStorage<string[]>(STORAGE_KEY_FAVORITES, []);
      },

      add: async (shopId: string): Promise<void> => {
        const ids = getFromStorage<string[]>(STORAGE_KEY_FAVORITES, []);
        if (!ids.includes(shopId)) {
          ids.push(shopId);
          setToStorage(STORAGE_KEY_FAVORITES, ids);
        }
      },

      remove: async (shopId: string): Promise<void> => {
        const ids = getFromStorage<string[]>(STORAGE_KEY_FAVORITES, []);
        const newIds = ids.filter(id => id !== shopId);
        setToStorage(STORAGE_KEY_FAVORITES, newIds);
      },
    },
  };
}
