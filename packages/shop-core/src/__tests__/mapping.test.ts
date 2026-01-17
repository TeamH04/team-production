import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { createMockApiStore } from '@team/test-utils';

import { mapApiStoreToShop, mapApiStoresToShops } from '../mapping';

describe('mapApiStoreToShop', () => {
  test('完全なAPIデータをShop型に正しく変換する', () => {
    const apiStore = createMockApiStore();
    const shop = mapApiStoreToShop(apiStore);

    assert.equal(shop.id, 'test-store-1');
    assert.equal(shop.name, 'テスト店舗');
    assert.equal(shop.category, 'カフェ・喫茶');
    assert.equal(shop.budget, '$$');
    assert.equal(shop.rating, 4.5);
    assert.equal(shop.distanceMinutes, 10);
    assert.equal(shop.placeId, 'place-123');
    assert.deepEqual(shop.tags, ['コーヒー', 'Wi-Fi']);
  });

  test('thumbnail_file.url を優先して使用する', () => {
    const apiStore = createMockApiStore({
      thumbnail_file: {
        file_id: 'file-1',
        file_name: 'thumbnail.jpg',
        object_key: 'thumbnails/1.jpg',
        url: 'https://cdn.example.com/thumbnail.jpg',
      },
      image_urls: ['https://example.com/fallback.jpg'],
    });

    const shop = mapApiStoreToShop(apiStore);
    assert.equal(shop.imageUrl, 'https://cdn.example.com/thumbnail.jpg');
  });

  test('urlResolver を使用してURLを解決する', () => {
    const apiStore = createMockApiStore({
      thumbnail_file: undefined,
      image_urls: ['path/to/image.jpg'],
    });

    const resolver = (path: string) => `https://cdn.example.com/${path}`;
    const shop = mapApiStoreToShop(apiStore, resolver);

    assert.equal(shop.imageUrl, 'https://cdn.example.com/path/to/image.jpg');
  });

  test('thumbnail_file がない場合 image_urls[0] を使用する', () => {
    const apiStore = createMockApiStore({
      thumbnail_file: undefined,
      image_urls: ['https://example.com/first.jpg', 'https://example.com/second.jpg'],
    });

    const shop = mapApiStoreToShop(apiStore);
    assert.equal(shop.imageUrl, 'https://example.com/first.jpg');
  });

  test('画像URLがない場合デフォルト画像を使用する', () => {
    const apiStore = createMockApiStore({
      thumbnail_file: undefined,
      image_urls: [],
    });

    const shop = mapApiStoreToShop(apiStore);
    assert.ok(shop.imageUrl.includes('unsplash.com'));
  });

  test('カテゴリが空の場合デフォルトカテゴリを使用する', () => {
    const apiStore = createMockApiStore({ category: '' });
    const shop = mapApiStoreToShop(apiStore);
    assert.equal(shop.category, 'カフェ・喫茶');
  });

  test('予算が空の場合デフォルト予算を使用する', () => {
    const apiStore = createMockApiStore({ budget: '' });
    const shop = mapApiStoreToShop(apiStore);
    assert.equal(shop.budget, '$$');
  });

  test('メニューを正しく変換する (price: number → string)', () => {
    const apiStore = createMockApiStore({
      menus: [
        { menu_id: 'm1', name: 'ラテ', price: 500, category: 'ドリンク' },
        { menu_id: 'm2', name: 'ケーキ', price: 1200, description: 'スイーツ' },
        { menu_id: 'm3', name: '水', price: null },
      ],
    });

    const shop = mapApiStoreToShop(apiStore);
    assert.equal(shop.menu!.length, 3);
    assert.equal(shop.menu![0].id, 'm1');
    assert.equal(shop.menu![0].name, 'ラテ');
    assert.equal(shop.menu![0].price, '¥500');
    assert.equal(shop.menu![0].category, 'ドリンク');
    assert.equal(shop.menu![1].price, '¥1,200');
    assert.equal(shop.menu![1].category, 'スイーツ');
    assert.equal(shop.menu![2].price, '');
  });

  test('メニューがない場合 undefined を返す', () => {
    const apiStore = createMockApiStore({ menus: undefined });
    const shop = mapApiStoreToShop(apiStore);
    assert.equal(shop.menu, undefined);
  });

  test('空のメニュー配列の場合 undefined を返す', () => {
    const apiStore = createMockApiStore({ menus: [] });
    const shop = mapApiStoreToShop(apiStore);
    assert.equal(shop.menu, undefined);
  });

  test('タグがない場合空配列を返す', () => {
    const apiStore = createMockApiStore({ tags: undefined as unknown as string[] });
    const shop = mapApiStoreToShop(apiStore);
    assert.deepEqual(shop.tags, []);
  });

  test('opened_at がない場合 created_at を使用する', () => {
    const apiStore = createMockApiStore({
      created_at: '2025-01-01T00:00:00.000Z',
      opened_at: null,
    });
    const shop = mapApiStoreToShop(apiStore);
    assert.ok(shop.openedAt);
  });

  test('説明がない場合空文字列を返す', () => {
    const apiStore = createMockApiStore({ description: null });
    const shop = mapApiStoreToShop(apiStore);
    assert.equal(shop.description, '');
  });

  test('distance_minutes がない場合デフォルト値を使用する', () => {
    const apiStore = createMockApiStore({ distance_minutes: undefined as unknown as number });
    const shop = mapApiStoreToShop(apiStore);
    assert.equal(shop.distanceMinutes, 5);
  });

  test('average_rating がない場合デフォルト値を使用する', () => {
    const apiStore = createMockApiStore({ average_rating: undefined as unknown as number });
    const shop = mapApiStoreToShop(apiStore);
    assert.equal(shop.rating, 0);
  });
});

describe('mapApiStoresToShops', () => {
  test('複数の店舗を正しく変換する', () => {
    const apiStores = [
      createMockApiStore({ store_id: 'store-1', name: '店舗1' }),
      createMockApiStore({ store_id: 'store-2', name: '店舗2' }),
    ];

    const shops = mapApiStoresToShops(apiStores);
    assert.equal(shops.length, 2);
    assert.equal(shops[0].id, 'store-1');
    assert.equal(shops[1].id, 'store-2');
  });

  test('空配列で空配列を返す', () => {
    const shops = mapApiStoresToShops([]);
    assert.deepEqual(shops, []);
  });
});
