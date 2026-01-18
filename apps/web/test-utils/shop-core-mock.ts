/**
 * @team/shop-core モジュールのモック定義
 *
 * vi.mock のホイスティング制約により、モック内で外部モジュールを直接使用できないため、
 * テストデータをこのファイルで一元管理する。
 */
import { BUDGET_LABEL, filterShops } from '@team/shop-core';
import { createMockShop } from '@team/test-utils';

import type { ShopCategory } from '@team/types';

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
 * @team/shop-core モジュールのモック
 * 使用例: vi.mock('@team/shop-core', () => shopCoreMock)
 */
export const shopCoreMock = {
  SHOPS: TEST_SHOPS,
  CATEGORIES: TEST_CATEGORIES,
  BUDGET_LABEL,
  filterShops,
};
