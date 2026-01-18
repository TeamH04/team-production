import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { createMockShop } from '@team/test-utils';

import { sortShops, type SortType } from '../sorting';

describe('sortShops', () => {
  describe('default ソート', () => {
    test('オリジナル順序を維持する', () => {
      const shops = [
        createMockShop({ id: 'shop-1', name: 'A店' }),
        createMockShop({ id: 'shop-2', name: 'B店' }),
        createMockShop({ id: 'shop-3', name: 'C店' }),
      ];

      const result = sortShops(shops, 'default');

      assert.equal(result[0].id, 'shop-1');
      assert.equal(result[1].id, 'shop-2');
      assert.equal(result[2].id, 'shop-3');
    });

    test('default の場合は同じ配列参照を返す', () => {
      const shops = [createMockShop({ id: 'shop-1' })];
      const result = sortShops(shops, 'default');

      assert.equal(result, shops);
    });
  });

  describe('rating-high ソート', () => {
    test('評価降順でソートする', () => {
      const shops = [
        createMockShop({ id: 'shop-1', rating: 3.0 }),
        createMockShop({ id: 'shop-2', rating: 5.0 }),
        createMockShop({ id: 'shop-3', rating: 4.0 }),
      ];

      const result = sortShops(shops, 'rating-high');

      assert.equal(result[0].id, 'shop-2');
      assert.equal(result[1].id, 'shop-3');
      assert.equal(result[2].id, 'shop-1');
    });

    test('同じ評価の場合は元の順序を維持する', () => {
      const shops = [
        createMockShop({ id: 'shop-1', rating: 4.0 }),
        createMockShop({ id: 'shop-2', rating: 4.0 }),
        createMockShop({ id: 'shop-3', rating: 4.0 }),
      ];

      const result = sortShops(shops, 'rating-high');

      assert.equal(result[0].id, 'shop-1');
      assert.equal(result[1].id, 'shop-2');
      assert.equal(result[2].id, 'shop-3');
    });
  });

  describe('rating-low ソート', () => {
    test('評価昇順でソートする', () => {
      const shops = [
        createMockShop({ id: 'shop-1', rating: 4.0 }),
        createMockShop({ id: 'shop-2', rating: 2.0 }),
        createMockShop({ id: 'shop-3', rating: 3.0 }),
      ];

      const result = sortShops(shops, 'rating-low');

      assert.equal(result[0].id, 'shop-2');
      assert.equal(result[1].id, 'shop-3');
      assert.equal(result[2].id, 'shop-1');
    });
  });

  describe('name-asc ソート', () => {
    test('名前昇順でソートする（日本語ロケール）', () => {
      const shops = [
        createMockShop({ id: 'shop-1', name: 'カフェC' }),
        createMockShop({ id: 'shop-2', name: 'カフェA' }),
        createMockShop({ id: 'shop-3', name: 'カフェB' }),
      ];

      const result = sortShops(shops, 'name-asc');

      assert.equal(result[0].name, 'カフェA');
      assert.equal(result[1].name, 'カフェB');
      assert.equal(result[2].name, 'カフェC');
    });

    test('ひらがな・カタカナ混在でも正しくソートする', () => {
      const shops = [
        createMockShop({ id: 'shop-1', name: 'うどん屋' }),
        createMockShop({ id: 'shop-2', name: 'アイス店' }),
        createMockShop({ id: 'shop-3', name: 'いちご農園' }),
      ];

      const result = sortShops(shops, 'name-asc');

      assert.equal(result[0].name, 'アイス店');
      assert.equal(result[1].name, 'いちご農園');
      assert.equal(result[2].name, 'うどん屋');
    });
  });

  describe('name-desc ソート', () => {
    test('名前降順でソートする', () => {
      const shops = [
        createMockShop({ id: 'shop-1', name: 'カフェA' }),
        createMockShop({ id: 'shop-2', name: 'カフェC' }),
        createMockShop({ id: 'shop-3', name: 'カフェB' }),
      ];

      const result = sortShops(shops, 'name-desc');

      assert.equal(result[0].name, 'カフェC');
      assert.equal(result[1].name, 'カフェB');
      assert.equal(result[2].name, 'カフェA');
    });
  });

  describe('newest ソート', () => {
    test('新着順（openedAt 降順）でソートする', () => {
      const shops = [
        createMockShop({ id: 'shop-1', openedAt: '2024-01-01T00:00:00.000Z' }),
        createMockShop({ id: 'shop-2', openedAt: '2024-06-01T00:00:00.000Z' }),
        createMockShop({ id: 'shop-3', openedAt: '2024-03-01T00:00:00.000Z' }),
      ];

      const result = sortShops(shops, 'newest');

      assert.equal(result[0].id, 'shop-2');
      assert.equal(result[1].id, 'shop-3');
      assert.equal(result[2].id, 'shop-1');
    });

    test('同じ日付の場合は元の順序を維持する', () => {
      const sameDate = '2024-05-01T00:00:00.000Z';
      const shops = [
        createMockShop({ id: 'shop-1', openedAt: sameDate }),
        createMockShop({ id: 'shop-2', openedAt: sameDate }),
      ];

      const result = sortShops(shops, 'newest');

      assert.equal(result[0].id, 'shop-1');
      assert.equal(result[1].id, 'shop-2');
    });
  });

  describe('空配列の処理', () => {
    test('空配列を渡すと空配列を返す', () => {
      const result = sortShops([], 'rating-high');
      assert.deepEqual(result, []);
    });

    test('各ソートタイプで空配列を正しく処理する', () => {
      const sortTypes: SortType[] = [
        'default',
        'rating-high',
        'rating-low',
        'name-asc',
        'name-desc',
        'newest',
      ];

      for (const sortType of sortTypes) {
        const result = sortShops([], sortType);
        assert.deepEqual(result, [], `sortType: ${sortType} で空配列を返すべき`);
      }
    });
  });

  describe('イミュータビリティ', () => {
    test('元の配列がミューテートされないこと', () => {
      const shops = [
        createMockShop({ id: 'shop-1', rating: 3.0 }),
        createMockShop({ id: 'shop-2', rating: 5.0 }),
        createMockShop({ id: 'shop-3', rating: 4.0 }),
      ];
      const originalOrder = shops.map(s => s.id);

      sortShops(shops, 'rating-high');

      assert.deepEqual(
        shops.map(s => s.id),
        originalOrder,
      );
    });

    test('ソート結果は新しい配列インスタンスである（default以外）', () => {
      const shops = [createMockShop({ id: 'shop-1' })];

      const result = sortShops(shops, 'rating-high');

      assert.notEqual(result, shops);
    });
  });

  describe('rating が undefined/null の場合の処理', () => {
    test('rating が undefined の場合は 0 として扱う（rating-high）', () => {
      const shops = [
        createMockShop({ id: 'shop-1', rating: undefined as unknown as number }),
        createMockShop({ id: 'shop-2', rating: 3.0 }),
        createMockShop({ id: 'shop-3', rating: 1.0 }),
      ];

      const result = sortShops(shops, 'rating-high');

      assert.equal(result[0].id, 'shop-2');
      assert.equal(result[1].id, 'shop-3');
      assert.equal(result[2].id, 'shop-1');
    });

    test('rating が undefined の場合は 0 として扱う（rating-low）', () => {
      const shops = [
        createMockShop({ id: 'shop-1', rating: 3.0 }),
        createMockShop({ id: 'shop-2', rating: undefined as unknown as number }),
        createMockShop({ id: 'shop-3', rating: 1.0 }),
      ];

      const result = sortShops(shops, 'rating-low');

      assert.equal(result[0].id, 'shop-2');
      assert.equal(result[1].id, 'shop-3');
      assert.equal(result[2].id, 'shop-1');
    });

    test('rating が null の場合は 0 として扱う', () => {
      const shops = [
        createMockShop({ id: 'shop-1', rating: null as unknown as number }),
        createMockShop({ id: 'shop-2', rating: 2.0 }),
      ];

      const result = sortShops(shops, 'rating-high');

      assert.equal(result[0].id, 'shop-2');
      assert.equal(result[1].id, 'shop-1');
    });

    test('複数の undefined/null rating を正しく処理する', () => {
      const shops = [
        createMockShop({ id: 'shop-1', rating: undefined as unknown as number }),
        createMockShop({ id: 'shop-2', rating: null as unknown as number }),
        createMockShop({ id: 'shop-3', rating: 0 }),
      ];

      const result = sortShops(shops, 'rating-high');

      // すべて 0 として扱われるため、元の順序が維持される
      assert.equal(result[0].id, 'shop-1');
      assert.equal(result[1].id, 'shop-2');
      assert.equal(result[2].id, 'shop-3');
    });
  });

  describe('単一要素の配列', () => {
    test('単一要素の配列を正しく処理する', () => {
      const shops = [createMockShop({ id: 'shop-1', name: '唯一の店' })];

      const result = sortShops(shops, 'name-asc');

      assert.equal(result.length, 1);
      assert.equal(result[0].id, 'shop-1');
    });
  });

  describe('openedAt が不正な日付の場合', () => {
    test('不正な日付文字列を含む店舗のソート', () => {
      const shops = [
        createMockShop({ id: 'shop-1', openedAt: 'invalid-date' }),
        createMockShop({ id: 'shop-2', openedAt: '2024-06-01T00:00:00.000Z' }),
        createMockShop({ id: 'shop-3', openedAt: '' }),
      ];

      // 不正な日付は NaN になるため、ソート結果の安定性を確認
      const result = sortShops(shops, 'newest');

      // 有効な日付を持つ shop-2 が結果に含まれていることを確認
      assert.ok(result.some(s => s.id === 'shop-2'));
      // 配列の長さが維持されていることを確認
      assert.equal(result.length, 3);
    });
  });

  describe('name が空文字列の場合', () => {
    test('空文字列の名前を含む店舗のソート（name-asc）', () => {
      const shops = [
        createMockShop({ id: 'shop-1', name: 'カフェB' }),
        createMockShop({ id: 'shop-2', name: '' }),
        createMockShop({ id: 'shop-3', name: 'カフェA' }),
      ];

      const result = sortShops(shops, 'name-asc');

      // 空文字列は辞書順で先頭に来る
      assert.equal(result[0].id, 'shop-2');
      assert.equal(result[1].name, 'カフェA');
      assert.equal(result[2].name, 'カフェB');
    });

    test('空文字列の名前を含む店舗のソート（name-desc）', () => {
      const shops = [
        createMockShop({ id: 'shop-1', name: 'カフェB' }),
        createMockShop({ id: 'shop-2', name: '' }),
        createMockShop({ id: 'shop-3', name: 'カフェA' }),
      ];

      const result = sortShops(shops, 'name-desc');

      // 空文字列は辞書順で最後に来る
      assert.equal(result[2].id, 'shop-2');
    });
  });
});
