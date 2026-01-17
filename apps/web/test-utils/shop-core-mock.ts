/**
 * @team/shop-core モジュールのモック定義
 *
 * vi.mock のホイスティング制約により、モック内で外部モジュールを直接使用できないため、
 * テストデータをこのファイルで一元管理する。
 *
 * 重要: 以下の実装は @team/shop-core の実装と同期を保つ必要があります:
 * - filterShops: packages/shop-core/src/search.ts
 * - BUDGET_LABEL: packages/shop-core/src/constants.ts
 *
 * 実装を変更する場合は、両方を更新してください。
 */
import { createMockShop } from '@team/test-utils';

import type { Shop, ShopCategory } from '@team/types';

/**
 * テスト用店舗データ
 */
export const TEST_SHOPS = [
  createMockShop({ id: 'shop-1', name: 'テストカフェ1', tags: ['コーヒー', 'Wi-Fi'] }),
  createMockShop({ id: 'shop-2', name: 'テストカフェ2', tags: ['紅茶'] }),
  createMockShop({
    id: 'shop-3',
    name: 'テストレストラン',
    category: 'レストラン',
    tags: ['豚骨', '深夜営業'],
  }),
  createMockShop({
    id: 'shop-4',
    name: 'テストバー',
    category: 'バー・居酒屋',
    tags: ['カクテル'],
  }),
  createMockShop({ id: 'shop-5', name: '店舗5', tags: ['静か'] }),
  createMockShop({ id: 'shop-6', name: '店舗6', tags: ['静か'] }),
  createMockShop({ id: 'shop-7', name: '店舗7', tags: ['静か'] }),
  createMockShop({ id: 'shop-8', name: '店舗8', tags: ['静か'] }),
  createMockShop({ id: 'shop-9', name: '店舗9', tags: ['静か'] }),
  createMockShop({ id: 'shop-10', name: '店舗10', tags: ['静か'] }),
];

/**
 * テスト用カテゴリ一覧
 */
export const TEST_CATEGORIES: ShopCategory[] = ['カフェ・喫茶', 'レストラン', 'バー・居酒屋'];

/**
 * 予算ラベルのマッピング
 */
export const BUDGET_LABEL = {
  $: '¥',
  $$: '¥¥',
  $$$: '¥¥¥',
};

/**
 * 検索オプション型
 */
type ShopSearchOptions = {
  query?: string;
  category?: ShopCategory | null;
  tags?: string[];
};

/**
 * 店舗をフィルタリング（実装のモック）
 */
export const filterShops = (shops: Shop[], options: ShopSearchOptions = {}): Shop[] => {
  const { query, category, tags } = options;
  const normalizedQuery = query?.trim().toLowerCase() ?? '';

  return shops.filter(shop => {
    // クエリマッチ
    const queryMatch =
      !normalizedQuery ||
      shop.name.toLowerCase().includes(normalizedQuery) ||
      shop.description.toLowerCase().includes(normalizedQuery) ||
      shop.tags.some(tag => tag.toLowerCase().includes(normalizedQuery));

    // カテゴリマッチ
    const categoryMatch = !category || shop.category === category;

    // タグマッチ
    const tagsMatch =
      !tags ||
      tags.length === 0 ||
      tags.some(t => shop.tags.some(shopTag => shopTag.toLowerCase().includes(t.toLowerCase())));

    return queryMatch && categoryMatch && tagsMatch;
  });
};

/**
 * @team/shop-core モジュールのモック
 * 使用例: vi.mock('@team/shop-core', () => shopCoreMock)
 */
export const shopCoreMock = {
  SHOPS: TEST_SHOPS,
  CATEGORIES: TEST_CATEGORIES,
  BUDGET_LABEL,
  filterShops,
};
