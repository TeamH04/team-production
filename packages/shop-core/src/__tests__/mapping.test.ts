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

  test('大量の店舗データ（50件）を変換できる', () => {
    const apiStores = Array.from({ length: 50 }, (_, i) =>
      createMockApiStore({ store_id: `store-${i}`, name: `店舗${i}` }),
    );

    const shops = mapApiStoresToShops(apiStores);
    assert.equal(shops.length, 50);
    assert.equal(shops[0].id, 'store-0');
    assert.equal(shops[49].id, 'store-49');
  });
});

describe('カテゴリと予算の検証', () => {
  test('無効なカテゴリ「不明」の場合デフォルトを使用する', () => {
    const apiStore = createMockApiStore({ category: '不明' });
    const shop = mapApiStoreToShop(apiStore);
    assert.equal(shop.category, 'カフェ・喫茶');
  });

  test('無効なカテゴリ「Other」の場合デフォルトを使用する', () => {
    const apiStore = createMockApiStore({ category: 'Other' });
    const shop = mapApiStoreToShop(apiStore);
    assert.equal(shop.category, 'カフェ・喫茶');
  });

  test('予算「$」が正しく処理される', () => {
    const apiStore = createMockApiStore({ budget: '$' });
    const shop = mapApiStoreToShop(apiStore);
    assert.equal(shop.budget, '$');
  });

  test('予算「$$$」が正しく処理される', () => {
    const apiStore = createMockApiStore({ budget: '$$$' });
    const shop = mapApiStoreToShop(apiStore);
    assert.equal(shop.budget, '$$$');
  });

  test('無効な予算の場合デフォルトを使用する', () => {
    const apiStore = createMockApiStore({ budget: '$$$$' });
    const shop = mapApiStoreToShop(apiStore);
    assert.equal(shop.budget, '$$');
  });
});

describe('メニュー変換の詳細', () => {
  test('price が 0 の場合「¥0」に変換される', () => {
    const apiStore = createMockApiStore({
      menus: [{ menu_id: 'm1', name: '無料サービス', price: 0 }],
    });

    const shop = mapApiStoreToShop(apiStore);
    assert.equal(shop.menu![0].price, '¥0');
  });

  test('price が大きい数字（1000000）の場合正しくフォーマットされる', () => {
    const apiStore = createMockApiStore({
      menus: [{ menu_id: 'm1', name: '高級コース', price: 1000000 }],
    });

    const shop = mapApiStoreToShop(apiStore);
    assert.equal(shop.menu![0].price, '¥1,000,000');
  });

  test('複数のメニューが正しく処理される', () => {
    const apiStore = createMockApiStore({
      menus: [
        { menu_id: 'm1', name: 'コーヒー', price: 300, category: 'ドリンク' },
        { menu_id: 'm2', name: 'サンドイッチ', price: 600, category: 'フード' },
        { menu_id: 'm3', name: 'ケーキ', price: 450, category: 'デザート' },
        { menu_id: 'm4', name: 'スペシャルセット', price: 1500, description: 'お得なセット' },
      ],
    });

    const shop = mapApiStoreToShop(apiStore);
    assert.equal(shop.menu!.length, 4);
    assert.equal(shop.menu![0].id, 'm1');
    assert.equal(shop.menu![0].name, 'コーヒー');
    assert.equal(shop.menu![0].price, '¥300');
    assert.equal(shop.menu![0].category, 'ドリンク');
    assert.equal(shop.menu![1].id, 'm2');
    assert.equal(shop.menu![1].price, '¥600');
    assert.equal(shop.menu![2].id, 'm3');
    assert.equal(shop.menu![2].price, '¥450');
    assert.equal(shop.menu![3].id, 'm4');
    assert.equal(shop.menu![3].price, '¥1,500');
    assert.equal(shop.menu![3].category, 'お得なセット');
  });
});

describe('URL処理の詳細', () => {
  test('resolver が undefined を返す場合、次の候補に進む', () => {
    const apiStore = createMockApiStore({
      thumbnail_file: undefined,
      image_urls: ['invalid/path.jpg', 'https://example.com/fallback.jpg'],
    });

    // resolver は非http URLに対してundefinedを返す
    const resolver = (path: string) => {
      if (path.startsWith('http')) return path;
      return undefined;
    };
    const shop = mapApiStoreToShop(apiStore, resolver);

    assert.equal(shop.imageUrl, 'https://example.com/fallback.jpg');
  });

  test('imageUrls 配列が正しく生成される', () => {
    const apiStore = createMockApiStore({
      thumbnail_file: undefined,
      image_urls: [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
        'https://example.com/image3.jpg',
      ],
    });

    const shop = mapApiStoreToShop(apiStore);
    assert.deepEqual(shop.imageUrls, [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
      'https://example.com/image3.jpg',
    ]);
  });
});

describe('数値フィールドのゼロ値処理', () => {
  test('rating が 0 の場合そのまま返す', () => {
    const apiStore = createMockApiStore({ average_rating: 0 });
    const shop = mapApiStoreToShop(apiStore);
    assert.equal(shop.rating, 0);
  });

  test('distanceMinutes が 0 の場合そのまま返す', () => {
    const apiStore = createMockApiStore({ distance_minutes: 0 });
    const shop = mapApiStoreToShop(apiStore);
    assert.equal(shop.distanceMinutes, 0);
  });
});

describe('価格のエッジケース', () => {
  test('price が負の値の場合もフォーマットされる', () => {
    const apiStore = createMockApiStore({
      menus: [{ menu_id: 'm1', name: '割引品', price: -100 }],
    });

    const shop = mapApiStoreToShop(apiStore);
    // 実装の挙動を確認（-100 が ¥-100 になるか等）
    assert.ok(shop.menu![0].price.includes('-'));
  });
});

describe('store_id のエッジケース', () => {
  test('store_id が空文字列の場合', () => {
    const apiStore = createMockApiStore({ store_id: '' });
    const shop = mapApiStoreToShop(apiStore);
    assert.equal(shop.id, '');
  });
});
