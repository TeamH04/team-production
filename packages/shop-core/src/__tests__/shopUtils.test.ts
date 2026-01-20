import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { createMockShop } from '@team/test-utils';

import {
  extractCategories,
  extractTagsByCategory,
  formatShopMeta,
  getShopImages,
} from '../shopUtils';

describe('extractCategories', () => {
  describe('空配列の処理', () => {
    test('空配列を渡すと空配列を返す', () => {
      const result = extractCategories([]);
      assert.deepEqual(result, []);
    });
  });

  describe('単一要素の処理', () => {
    test('単一のショップからカテゴリを抽出する', () => {
      const shops = [createMockShop({ category: 'カフェ・喫茶' })];

      const result = extractCategories(shops);

      assert.deepEqual(result, ['カフェ・喫茶']);
    });
  });

  describe('重複要素の処理', () => {
    test('重複するカテゴリは1つにまとめられる', () => {
      const shops = [
        createMockShop({ id: 'shop-1', category: 'カフェ・喫茶' }),
        createMockShop({ id: 'shop-2', category: 'カフェ・喫茶' }),
        createMockShop({ id: 'shop-3', category: 'カフェ・喫茶' }),
      ];

      const result = extractCategories(shops);

      assert.deepEqual(result, ['カフェ・喫茶']);
    });

    test('異なるカテゴリと重複するカテゴリが混在する場合', () => {
      const shops = [
        createMockShop({ id: 'shop-1', category: 'カフェ・喫茶' }),
        createMockShop({ id: 'shop-2', category: 'バー・居酒屋' }),
        createMockShop({ id: 'shop-3', category: 'カフェ・喫茶' }),
        createMockShop({ id: 'shop-4', category: 'レストラン' }),
        createMockShop({ id: 'shop-5', category: 'バー・居酒屋' }),
      ];

      const result = extractCategories(shops);

      assert.equal(result.length, 3);
      assert.ok(result.includes('カフェ・喫茶'));
      assert.ok(result.includes('バー・居酒屋'));
      assert.ok(result.includes('レストラン'));
    });
  });

  describe('ソート順序の確認', () => {
    test('カテゴリがアルファベット順（辞書順）でソートされる', () => {
      const shops = [
        createMockShop({ id: 'shop-1', category: 'レストラン' }),
        createMockShop({ id: 'shop-2', category: 'カフェ・喫茶' }),
        createMockShop({ id: 'shop-3', category: 'バー・居酒屋' }),
      ];

      const result = extractCategories(shops);

      assert.deepEqual(result, ['カフェ・喫茶', 'バー・居酒屋', 'レストラン']);
    });

    test('異なる文字種のカテゴリ名がソートされる', () => {
      const shops = [
        createMockShop({ id: 'shop-1', category: 'ビュッフェ・食べ放題' }),
        createMockShop({ id: 'shop-2', category: 'カフェ・喫茶' }),
        createMockShop({ id: 'shop-3', category: 'ベーカリー・パン' }),
      ];

      const result = extractCategories(shops);

      // 辞書順でソートされる
      assert.equal(result[0], 'カフェ・喫茶');
      assert.equal(result[1], 'ビュッフェ・食べ放題');
      assert.equal(result[2], 'ベーカリー・パン');
    });
  });
});

describe('extractTagsByCategory', () => {
  describe('空配列の処理', () => {
    test('空配列を渡すと空オブジェクトを返す', () => {
      const result = extractTagsByCategory([]);
      assert.deepEqual(result, {});
    });

    test('tags が undefined のショップでもエラーが発生しない', () => {
      const shops = [
        createMockShop({
          category: 'カフェ・喫茶',
          tags: undefined as unknown as string[],
        }),
      ];

      const result = extractTagsByCategory(shops);

      assert.deepEqual(result, { 'カフェ・喫茶': [] });
    });
  });

  describe('単一カテゴリ・単一タグの処理', () => {
    test('単一のショップから単一のタグを抽出する', () => {
      const shops = [createMockShop({ category: 'カフェ・喫茶', tags: ['Wi-Fi'] })];

      const result = extractTagsByCategory(shops);

      assert.deepEqual(result, { 'カフェ・喫茶': ['Wi-Fi'] });
    });

    test('タグが空配列のショップを処理する', () => {
      const shops = [createMockShop({ category: 'カフェ・喫茶', tags: [] })];

      const result = extractTagsByCategory(shops);

      assert.deepEqual(result, { 'カフェ・喫茶': [] });
    });
  });

  describe('複数カテゴリ・複数タグの処理', () => {
    test('複数カテゴリに対してそれぞれのタグを抽出する', () => {
      const shops = [
        createMockShop({ id: 'shop-1', category: 'カフェ・喫茶', tags: ['Wi-Fi', '静か'] }),
        createMockShop({ id: 'shop-2', category: 'バー・居酒屋', tags: ['こってり', 'あっさり'] }),
      ];

      const result = extractTagsByCategory(shops);

      assert.deepEqual(result['カフェ・喫茶'], ['Wi-Fi', '静か']);
      assert.deepEqual(result['バー・居酒屋'], ['あっさり', 'こってり']);
    });

    test('同じカテゴリの複数ショップからタグを集約する', () => {
      const shops = [
        createMockShop({ id: 'shop-1', category: 'カフェ・喫茶', tags: ['Wi-Fi'] }),
        createMockShop({ id: 'shop-2', category: 'カフェ・喫茶', tags: ['静か'] }),
        createMockShop({ id: 'shop-3', category: 'カフェ・喫茶', tags: ['電源あり'] }),
      ];

      const result = extractTagsByCategory(shops);

      assert.equal(Object.keys(result).length, 1);
      assert.equal(result['カフェ・喫茶'].length, 3);
      assert.ok(result['カフェ・喫茶'].includes('Wi-Fi'));
      assert.ok(result['カフェ・喫茶'].includes('静か'));
      assert.ok(result['カフェ・喫茶'].includes('電源あり'));
    });
  });

  describe('重複タグの処理', () => {
    test('同じカテゴリ内の重複タグは1つにまとめられる', () => {
      const shops = [
        createMockShop({ id: 'shop-1', category: 'カフェ・喫茶', tags: ['Wi-Fi', '静か'] }),
        createMockShop({ id: 'shop-2', category: 'カフェ・喫茶', tags: ['Wi-Fi', '電源あり'] }),
        createMockShop({ id: 'shop-3', category: 'カフェ・喫茶', tags: ['静か', '電源あり'] }),
      ];

      const result = extractTagsByCategory(shops);

      assert.equal(result['カフェ・喫茶'].length, 3);
      assert.ok(result['カフェ・喫茶'].includes('Wi-Fi'));
      assert.ok(result['カフェ・喫茶'].includes('静か'));
      assert.ok(result['カフェ・喫茶'].includes('電源あり'));
    });

    test('同一ショップ内の重複タグも正しく処理する', () => {
      const shops = [
        createMockShop({ category: 'カフェ・喫茶', tags: ['Wi-Fi', 'Wi-Fi', '静か'] }),
      ];

      const result = extractTagsByCategory(shops);

      // Set で重複が除去されるため、2つになる
      assert.equal(result['カフェ・喫茶'].length, 2);
    });
  });

  describe('ソート順序の確認', () => {
    test('各カテゴリのタグがUnicodeコードポイント順でソートされる', () => {
      const shops = [
        createMockShop({
          id: 'shop-1',
          category: 'カフェ・喫茶',
          tags: ['電源あり', 'Wi-Fi', '静か'],
        }),
      ];

      const result = extractTagsByCategory(shops);

      assert.deepEqual(result['カフェ・喫茶'], ['Wi-Fi', '電源あり', '静か']);
    });

    test('複数カテゴリでそれぞれのタグがソートされる', () => {
      const shops = [
        createMockShop({ id: 'shop-1', category: 'カフェ・喫茶', tags: ['静か', 'Wi-Fi'] }),
        createMockShop({ id: 'shop-2', category: 'バー・居酒屋', tags: ['こってり', 'あっさり'] }),
      ];

      const result = extractTagsByCategory(shops);

      assert.deepEqual(result['カフェ・喫茶'], ['Wi-Fi', '静か']);
      assert.deepEqual(result['バー・居酒屋'], ['あっさり', 'こってり']);
    });

    test('ひらがな・カタカナ・英数字混在のタグもソートされる', () => {
      const shops = [
        createMockShop({
          category: 'カフェ・喫茶',
          tags: ['ペット可', 'Wi-Fi', 'おしゃれ', '24時間'],
        }),
      ];

      const result = extractTagsByCategory(shops);

      // Unicodeコードポイント順でソートされる（'2' < 'W' < 'お' < 'ペ'）
      assert.equal(result['カフェ・喫茶'][0], '24時間');
      assert.equal(result['カフェ・喫茶'][1], 'Wi-Fi');
      assert.equal(result['カフェ・喫茶'][2], 'おしゃれ');
      assert.equal(result['カフェ・喫茶'][3], 'ペット可');
    });
  });
});

describe('formatShopMeta', () => {
  describe('full フォーマット（デフォルト）', () => {
    test('正しいフォーマットで出力される', () => {
      const shop = createMockShop({
        category: 'カフェ・喫茶',
        distanceMinutes: 5,
        budget: '$$',
      });

      const result = formatShopMeta(shop);

      assert.equal(result, 'カフェ・喫茶 • 徒歩5分 • 予算 ¥¥');
    });

    test('budget が正しく BUDGET_LABEL で変換される', () => {
      const shop1 = createMockShop({ category: 'カフェ・喫茶', distanceMinutes: 3, budget: '$' });
      const shop2 = createMockShop({ category: 'カフェ・喫茶', distanceMinutes: 3, budget: '$$' });
      const shop3 = createMockShop({ category: 'カフェ・喫茶', distanceMinutes: 3, budget: '$$$' });

      assert.equal(formatShopMeta(shop1, 'full'), 'カフェ・喫茶 • 徒歩3分 • 予算 ¥');
      assert.equal(formatShopMeta(shop2, 'full'), 'カフェ・喫茶 • 徒歩3分 • 予算 ¥¥');
      assert.equal(formatShopMeta(shop3, 'full'), 'カフェ・喫茶 • 徒歩3分 • 予算 ¥¥¥');
    });
  });

  describe('compact フォーマット', () => {
    test('正しいフォーマットで出力される', () => {
      const shop = createMockShop({
        category: 'バー・居酒屋',
        distanceMinutes: 10,
        budget: '$$$',
      });

      const result = formatShopMeta(shop, 'compact');

      assert.equal(result, 'バー・居酒屋 • $$$ • 徒歩10分');
    });

    test('budget が falsy の場合、budget 部分が省略される', () => {
      const shop = createMockShop({
        category: 'レストラン',
        distanceMinutes: 7,
        budget: '' as '$',
      });

      const result = formatShopMeta(shop, 'compact');

      assert.equal(result, 'レストラン • 徒歩7分');
    });
  });
});

describe('getShopImages', () => {
  describe('imageUrls がある場合', () => {
    test('imageUrls を返す', () => {
      const shop = createMockShop({
        imageUrl: 'https://example.com/single.jpg',
        imageUrls: [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg',
          'https://example.com/image3.jpg',
        ],
      });

      const result = getShopImages(shop);

      assert.deepEqual(result, [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
        'https://example.com/image3.jpg',
      ]);
    });
  });

  describe('imageUrls が空配列の場合', () => {
    test('imageUrl を配列で返す', () => {
      const shop = createMockShop({
        imageUrl: 'https://example.com/fallback.jpg',
        imageUrls: [],
      });

      const result = getShopImages(shop);

      assert.deepEqual(result, ['https://example.com/fallback.jpg']);
    });
  });

  describe('imageUrls が undefined の場合', () => {
    test('imageUrl を配列で返す', () => {
      const shop = createMockShop({
        imageUrl: 'https://example.com/default.jpg',
        imageUrls: undefined,
      });

      const result = getShopImages(shop);

      assert.deepEqual(result, ['https://example.com/default.jpg']);
    });
  });
});
