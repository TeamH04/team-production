import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { createMockShop } from '@team/test-utils';

import { resolveMenuName } from '../menuUtils';

describe('resolveMenuName', () => {
  describe('menuItemName が設定されている場合', () => {
    test('menuItemName をそのまま返す', () => {
      const shop = createMockShop({ id: 'shop-1' });
      const container = { menuItemName: '特製ラーメン / 餃子セット' };

      const result = resolveMenuName(shop, container);

      assert.equal(result, '特製ラーメン / 餃子セット');
    });

    test('menuItemIds があっても menuItemName を優先する', () => {
      const shop = createMockShop({
        id: 'shop-1',
        menu: [{ id: 'menu-1', name: 'カレーライス', category: 'メイン', price: '800円' }],
      });
      const container = {
        menuItemIds: ['menu-1'],
        menuItemName: '特製カレー',
      };

      const result = resolveMenuName(shop, container);

      assert.equal(result, '特製カレー');
    });
  });

  describe('menuItemIds から解決する場合', () => {
    test('単一のメニューIDからメニュー名を解決する', () => {
      const shop = createMockShop({
        id: 'shop-1',
        menu: [
          { id: 'menu-1', name: 'ラーメン', category: 'メイン', price: '850円' },
          { id: 'menu-2', name: '餃子', category: 'サイド', price: '350円' },
        ],
      });
      const container = { menuItemIds: ['menu-1'] };

      const result = resolveMenuName(shop, container);

      assert.equal(result, 'ラーメン');
    });

    test('複数のメニューIDを "/" で結合して返す', () => {
      const shop = createMockShop({
        id: 'shop-1',
        menu: [
          { id: 'menu-1', name: 'ラーメン', category: 'メイン', price: '850円' },
          { id: 'menu-2', name: '餃子', category: 'サイド', price: '350円' },
          { id: 'menu-3', name: 'チャーハン', category: 'メイン', price: '700円' },
        ],
      });
      const container = { menuItemIds: ['menu-1', 'menu-3'] };

      const result = resolveMenuName(shop, container);

      assert.equal(result, 'ラーメン / チャーハン');
    });

    test('存在しないメニューIDは無視される', () => {
      const shop = createMockShop({
        id: 'shop-1',
        menu: [{ id: 'menu-1', name: 'ラーメン', category: 'メイン', price: '850円' }],
      });
      const container = { menuItemIds: ['menu-1', 'menu-999'] };

      const result = resolveMenuName(shop, container);

      assert.equal(result, 'ラーメン');
    });

    test('すべてのメニューIDが存在しない場合は undefined', () => {
      const shop = createMockShop({
        id: 'shop-1',
        menu: [{ id: 'menu-1', name: 'ラーメン', category: 'メイン', price: '850円' }],
      });
      const container = { menuItemIds: ['menu-999'] };

      const result = resolveMenuName(shop, container);

      assert.equal(result, undefined);
    });
  });

  describe('undefined を返すケース', () => {
    test('shop が undefined の場合', () => {
      const container = { menuItemIds: ['menu-1'] };

      const result = resolveMenuName(undefined, container);

      assert.equal(result, undefined);
    });

    test('shop が null の場合', () => {
      const container = { menuItemIds: ['menu-1'] };

      const result = resolveMenuName(null, container);

      assert.equal(result, undefined);
    });

    test('shop.menu が undefined の場合', () => {
      const shop = createMockShop({ id: 'shop-1', menu: undefined });
      const container = { menuItemIds: ['menu-1'] };

      const result = resolveMenuName(shop, container);

      assert.equal(result, undefined);
    });

    test('menuItemIds が空配列の場合', () => {
      const shop = createMockShop({
        id: 'shop-1',
        menu: [{ id: 'menu-1', name: 'ラーメン', category: 'メイン', price: '850円' }],
      });
      const container = { menuItemIds: [] };

      const result = resolveMenuName(shop, container);

      assert.equal(result, undefined);
    });

    test('menuItemIds が undefined の場合', () => {
      const shop = createMockShop({
        id: 'shop-1',
        menu: [{ id: 'menu-1', name: 'ラーメン', category: 'メイン', price: '850円' }],
      });
      const container = {};

      const result = resolveMenuName(shop, container);

      assert.equal(result, undefined);
    });

    test('menuItemName も menuItemIds も undefined の場合', () => {
      const shop = createMockShop({ id: 'shop-1' });
      const container = {};

      const result = resolveMenuName(shop, container);

      assert.equal(result, undefined);
    });
  });

  describe('メニューの順序', () => {
    test('shop.menu の順序でメニュー名が結合される', () => {
      const shop = createMockShop({
        id: 'shop-1',
        menu: [
          { id: 'menu-1', name: 'A品', category: 'メイン', price: '500円' },
          { id: 'menu-2', name: 'B品', category: 'メイン', price: '600円' },
          { id: 'menu-3', name: 'C品', category: 'メイン', price: '700円' },
        ],
      });
      // menuItemIds の順序は逆だが、shop.menu の順序で結合される
      const container = { menuItemIds: ['menu-3', 'menu-1'] };

      const result = resolveMenuName(shop, container);

      assert.equal(result, 'A品 / C品');
    });
  });
});
