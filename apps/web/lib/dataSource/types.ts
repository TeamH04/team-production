import type { RatingDetails, ReviewSort, ReviewWithUser, Shop } from '@team/types';

/**
 * レビュー作成時の入力データ
 */
export type CreateReviewInput = {
  shopId: string;
  rating: number;
  ratingDetails?: RatingDetails;
  comment?: string;
};

/**
 * データソースの共通インターフェース
 * モック実装とAPI実装で同じインターフェースを提供
 */
export interface DataSource {
  /** 店舗関連の操作 */
  shops: {
    /** 全店舗を取得 */
    getAll: () => Promise<Shop[]>;
    /** IDで店舗を取得 */
    getById: (id: string) => Promise<Shop | undefined>;
    /** カテゴリ一覧を取得 */
    getCategories: () => Promise<string[]>;
  };

  /** レビュー関連の操作 */
  reviews: {
    /** 店舗IDでレビューを取得 */
    getByShopId: (shopId: string, sort?: ReviewSort) => Promise<ReviewWithUser[]>;
    /** ユーザーIDでレビューを取得 */
    getByUserId: (userId: string) => Promise<ReviewWithUser[]>;
    /** レビューを作成 */
    create: (input: CreateReviewInput) => Promise<ReviewWithUser>;
    /** いいねをトグル */
    toggleLike: (reviewId: string, currentlyLiked: boolean) => Promise<void>;
  };

  /** お気に入り関連の操作 */
  favorites: {
    /** お気に入り店舗IDの一覧を取得 */
    getIds: () => Promise<string[]>;
    /** お気に入りに追加 */
    add: (shopId: string) => Promise<void>;
    /** お気に入りから削除 */
    remove: (shopId: string) => Promise<void>;
  };
}

/**
 * データソースの種類
 */
export type DataSourceType = 'mock' | 'api';
