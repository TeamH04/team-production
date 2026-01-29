import { mapApiReview, mapApiStoreToShop } from '@team/shop-core';

import { api } from '../api';
import { getAccessToken, withAuth } from '../auth';
import { storage } from '../storage';

import type { CreateReviewInput, DataSource } from './types';
import type { ReviewSort, ReviewWithUser, Shop } from '@team/types';

/**
 * API データソースの実装
 * バックエンドAPIに接続してデータを取得・更新する
 */
export function createApiDataSource(): DataSource {
  return {
    shops: {
      getAll: async (): Promise<Shop[]> => {
        const stores = await api.fetchStores();
        return storage.mapStores(stores);
      },

      getById: async (id: string): Promise<Shop | undefined> => {
        try {
          const store = await api.fetchStoreById(id);
          return mapApiStoreToShop(store, storage.buildStorageUrl);
        } catch {
          return undefined;
        }
      },

      getCategories: async (): Promise<string[]> => {
        const stores = await api.fetchStores();
        const shops = storage.mapStores(stores);
        const categories = [...new Set(shops.map(s => s.category))];
        return categories.sort();
      },
    },

    reviews: {
      getByShopId: async (shopId: string, sort: ReviewSort = 'new'): Promise<ReviewWithUser[]> => {
        const token = await getAccessToken();
        const reviews = await api.fetchStoreReviews(shopId, sort, token ?? undefined);

        return reviews.map(r => ({
          ...mapApiReview(r),
          userName: 'ユーザー', // TODO: APIにユーザー名が含まれるようになったら置換
        }));
      },

      getByUserId: async (userId: string): Promise<ReviewWithUser[]> => {
        const token = await getAccessToken();
        if (!token) return [];

        const reviews = await api.fetchUserReviews(userId, token);
        return reviews.map(r => ({
          ...mapApiReview(r),
          userName: 'あなた',
        }));
      },

      create: async (input: CreateReviewInput): Promise<ReviewWithUser> => {
        return withAuth(async token => {
          const result = await api.createReview(
            input.shopId,
            {
              rating: input.rating,
              rating_details: input.ratingDetails ?? null,
              content: input.comment ?? null,
            },
            token,
          );

          return {
            ...mapApiReview(result),
            userName: 'あなた',
          };
        });
      },

      toggleLike: async (reviewId: string, currentlyLiked: boolean): Promise<void> => {
        return withAuth(async token => {
          if (currentlyLiked) {
            await api.unlikeReview(reviewId, token);
          } else {
            await api.likeReview(reviewId, token);
          }
        });
      },
    },

    favorites: {
      getIds: async (): Promise<string[]> => {
        const token = await getAccessToken();
        if (!token) return [];

        const favorites = await api.fetchUserFavorites(token);
        return favorites.map(f => f.store_id);
      },

      add: async (shopId: string): Promise<void> => {
        return withAuth(async token => {
          await api.addFavorite(shopId, token);
        });
      },

      remove: async (shopId: string): Promise<void> => {
        return withAuth(async token => {
          await api.removeFavorite(shopId, token);
        });
      },
    },
  };
}
