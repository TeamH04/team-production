/**
 * 共通テストモックデータファクトリ
 *
 * mobile/web で共有するテスト用モックデータ生成関数
 */
import type { ApiReview, ApiStore, RatingDetails, ReviewWithUser, Shop } from '@team/types';

/** テスト用デフォルトトークン */
export const TEST_DEFAULT_TOKEN = 'test-token';

/** テスト用ベース日時（ISO形式） */
export const TEST_BASE_DATE_ISO = '2025-01-01T00:00:00.000Z';

/** テスト用デフォルト住所 */
export const TEST_DEFAULT_ADDRESS = '東京都渋谷区テスト1-2-3';

/** テスト用デフォルトプレイスID */
export const TEST_DEFAULT_PLACE_ID = 'place-123';

/** テストデータの基準日 */
export const TEST_BASE_DATE = '2025-01-01';

/** テスト用のデフォルト位置情報（東京駅） */
export const DEFAULT_TEST_LOCATION = {
  latitude: 35.6812,
  longitude: 139.7671,
} as const;

/**
 * ApiStore のモックデータを作成
 */
export const createMockApiStore = (overrides: Partial<ApiStore> = {}): ApiStore => ({
  store_id: 'test-store-1',
  name: 'テスト店舗',
  category: 'カフェ・喫茶',
  budget: '$$',
  average_rating: 4.5,
  distance_minutes: 10,
  created_at: TEST_BASE_DATE_ISO,
  updated_at: TEST_BASE_DATE_ISO,
  opened_at: TEST_BASE_DATE_ISO,
  place_id: TEST_DEFAULT_PLACE_ID,
  address: TEST_DEFAULT_ADDRESS,
  latitude: 35.6812,
  longitude: 139.7671,
  is_approved: true,
  image_urls: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
  tags: ['コーヒー', 'Wi-Fi'],
  ...overrides,
});

/**
 * Shop のモックデータを作成
 */
export const createMockShop = (overrides: Partial<Shop> = {}): Shop => ({
  id: 'test-shop-1',
  name: 'テストカフェ',
  category: 'カフェ・喫茶',
  distanceMinutes: 5,
  rating: 4.5,
  budget: '$$',
  createdAt: TEST_BASE_DATE_ISO,
  openedAt: TEST_BASE_DATE_ISO,
  description: 'おしゃれなカフェです。Wi-Fi完備。',
  address: TEST_DEFAULT_ADDRESS,
  placeId: TEST_DEFAULT_PLACE_ID,
  imageUrl: 'https://example.com/image.jpg',
  tags: ['コーヒー', 'Wi-Fi', '静か'],
  ...overrides,
});

/**
 * Shop から ApiStore への変換（テスト用）
 * StoresContext等のテストで、Shopデータを元にApiStoreを生成する場合に使用
 */
export const shopToApiStore = (shop: Shop): ApiStore => ({
  store_id: shop.id,
  name: shop.name,
  category: shop.category,
  budget: shop.budget,
  average_rating: shop.rating,
  distance_minutes: shop.distanceMinutes,
  created_at: shop.createdAt,
  updated_at: shop.createdAt,
  opened_at: shop.openedAt ?? shop.createdAt,
  place_id: shop.placeId,
  address: shop.address ?? TEST_DEFAULT_ADDRESS,
  latitude: 35.6812,
  longitude: 139.7671,
  is_approved: true,
  image_urls: shop.imageUrls ?? (shop.imageUrl ? [shop.imageUrl] : []),
  tags: shop.tags ?? [],
});

/**
 * ApiReview のモックデータを作成
 */
export const createMockApiReview = (
  reviewId: string,
  storeId: string,
  overrides: Partial<ApiReview> = {},
): ApiReview => ({
  review_id: reviewId,
  store_id: storeId,
  user_id: 'user-1',
  rating: 4,
  content: 'Great place!',
  created_at: TEST_BASE_DATE_ISO,
  likes_count: 5,
  liked_by_me: false,
  files: [],
  ...overrides,
});

// =============================================================================
// Mock Review Templates & Utilities
// =============================================================================

/**
 * モックレビューテンプレート
 * テストやPOC用のダミーレビューデータ生成に使用
 */
export const MOCK_REVIEW_TEMPLATES: ReadonlyArray<{
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
  {
    comment: 'コスパが良くておすすめです。ランチタイムは特にお得！',
    rating: 4,
    ratingDetails: { taste: 4, atmosphere: 4, service: 4, speed: 5, cleanliness: 4 },
  },
  {
    comment: '接客がとても丁寧で気持ちよく過ごせました。',
    rating: 5,
    ratingDetails: { taste: 4, atmosphere: 4, service: 5, speed: 4, cleanliness: 5 },
  },
] as const;

/**
 * モックユーザー名リスト
 * テストやPOC用のダミーユーザー名
 */
export const MOCK_USER_NAMES: readonly string[] = [
  '田中さん',
  '山田さん',
  '鈴木さん',
  '佐藤さん',
  '高橋さん',
] as const;

/**
 * ReviewWithUser のモックデータを作成
 *
 * @param overrides - デフォルト値を上書きするプロパティ
 * @returns ReviewWithUser オブジェクト
 */
export const createMockReviewWithUser = (
  overrides: Partial<ReviewWithUser> = {},
): ReviewWithUser => ({
  id: 'mock-review-1',
  shopId: 'shop-1',
  userId: 'user-1',
  userName: MOCK_USER_NAMES[0],
  rating: MOCK_REVIEW_TEMPLATES[0].rating,
  ratingDetails: MOCK_REVIEW_TEMPLATES[0].ratingDetails,
  comment: MOCK_REVIEW_TEMPLATES[0].comment,
  createdAt: TEST_BASE_DATE_ISO,
  likesCount: 0,
  likedByMe: false,
  ...overrides,
});

export type GenerateMockReviewsOptions = {
  /** レビュー生成数 */
  count: number;
  /** 基準日（デフォルト: TEST_BASE_DATE） */
  baseDate?: string;
  /** 日付間隔（日数、デフォルト: 3） */
  dateIntervalDays?: number;
};

/**
 * 店舗IDに基づいてモックレビューを生成
 *
 * @param shopId - 店舗ID
 * @param options - 生成オプション
 * @returns ReviewWithUser の配列
 */
export const generateMockReviews = (
  shopId: string,
  options: GenerateMockReviewsOptions,
): ReviewWithUser[] => {
  const { count, baseDate = TEST_BASE_DATE, dateIntervalDays = 3 } = options;
  const reviews: ReviewWithUser[] = [];
  const baseDateObj = new Date(baseDate);

  for (let i = 0; i < count; i++) {
    const template = MOCK_REVIEW_TEMPLATES[i % MOCK_REVIEW_TEMPLATES.length];
    const userName = MOCK_USER_NAMES[i % MOCK_USER_NAMES.length];
    const reviewDate = new Date(baseDateObj);
    reviewDate.setDate(reviewDate.getDate() - i * dateIntervalDays);

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
};
