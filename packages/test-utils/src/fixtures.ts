/**
 * 共通テストモックデータファクトリ
 *
 * mobile/web で共有するテスト用モックデータ生成関数
 */
import type { ApiReview, ApiStore, Shop } from '@team/types';

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
  created_at: '2025-01-01T00:00:00.000Z',
  updated_at: '2025-01-01T00:00:00.000Z',
  opened_at: '2025-01-01T00:00:00.000Z',
  place_id: 'place-123',
  address: '東京都渋谷区テスト1-2-3',
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
  createdAt: '2025-01-01T00:00:00.000Z',
  openedAt: '2025-01-01T00:00:00.000Z',
  description: 'おしゃれなカフェです。Wi-Fi完備。',
  address: '東京都渋谷区テスト1-2-3',
  placeId: 'place-123',
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
  address: shop.address ?? '東京都渋谷区テスト1-2-3',
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
  created_at: '2025-01-01T00:00:00.000Z',
  likes_count: 5,
  liked_by_me: false,
  files: [],
  ...overrides,
});
