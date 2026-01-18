import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { createMockShop } from '@team/test-utils';

import { filterShops, matchesCategory, matchesSearchQuery, matchesTags } from '../search';

describe('matchesSearchQuery', () => {
  test('空のクエリで全てマッチする', () => {
    const shop = createMockShop({ name: 'テストカフェ' });
    assert.equal(matchesSearchQuery(shop, ''), true);
  });

  test('店舗名での検索がマッチする', () => {
    const shop = createMockShop({ name: 'おしゃれカフェ' });
    assert.equal(matchesSearchQuery(shop, 'おしゃれ'), true);
  });

  test('店舗名に含まれないクエリでマッチしない', () => {
    const shop = createMockShop({ name: 'おしゃれカフェ', description: '', tags: [] });
    assert.equal(matchesSearchQuery(shop, 'ラーメン'), false);
  });

  test('説明文での検索がマッチする', () => {
    const shop = createMockShop({
      name: 'テスト店舗',
      description: '静かな雰囲気のお店です',
    });
    assert.equal(matchesSearchQuery(shop, '静か'), true);
  });

  test('タグでの検索がマッチする', () => {
    const shop = createMockShop({
      name: 'テスト店舗',
      description: '',
      tags: ['Wi-Fi', 'コンセント'],
    });
    assert.equal(matchesSearchQuery(shop, 'Wi-Fi'), true);
  });

  test('大文字小文字を無視して検索できる', () => {
    const shop = createMockShop({
      name: 'WiFi Cafe',
      description: '',
      tags: [],
    });
    assert.equal(matchesSearchQuery(shop, 'wifi'), true);
    assert.equal(matchesSearchQuery(shop, 'WIFI'), true);
    assert.equal(matchesSearchQuery(shop, 'WiFi'), true);
  });

  test('タグの大文字小文字を無視して検索できる', () => {
    const shop = createMockShop({
      name: 'テスト店舗',
      description: '',
      tags: ['COFFEE', 'Latte'],
    });
    assert.equal(matchesSearchQuery(shop, 'coffee'), true);
    assert.equal(matchesSearchQuery(shop, 'latte'), true);
  });

  test('部分一致で検索できる', () => {
    const shop = createMockShop({ name: '新宿カフェ店' });
    assert.equal(matchesSearchQuery(shop, '新宿'), true);
    assert.equal(matchesSearchQuery(shop, 'カフェ'), true);
    assert.equal(matchesSearchQuery(shop, '店'), true);
  });
});

describe('matchesCategory', () => {
  test('カテゴリがnullの場合全てマッチする', () => {
    const shop = createMockShop({ category: 'カフェ・喫茶' });
    assert.equal(matchesCategory(shop, null), true);
  });

  test('カテゴリがundefinedの場合全てマッチする', () => {
    const shop = createMockShop({ category: 'カフェ・喫茶' });
    assert.equal(matchesCategory(shop, undefined), true);
  });

  test('カテゴリが一致する場合マッチする', () => {
    const shop = createMockShop({ category: 'カフェ・喫茶' });
    assert.equal(matchesCategory(shop, 'カフェ・喫茶'), true);
  });

  test('カテゴリが一致しない場合マッチしない', () => {
    const shop = createMockShop({ category: 'カフェ・喫茶' });
    assert.equal(matchesCategory(shop, 'レストラン'), false);
  });

  test('異なるカテゴリでマッチしない', () => {
    const shop = createMockShop({ category: 'レストラン' });
    assert.equal(matchesCategory(shop, 'カフェ・喫茶'), false);
  });
});

describe('matchesTags', () => {
  test('空のタグ配列で全てマッチする', () => {
    const shop = createMockShop({ tags: ['Wi-Fi', 'コンセント'] });
    assert.equal(matchesTags(shop, []), true);
  });

  test('タグがundefinedの場合全てマッチする', () => {
    const shop = createMockShop({ tags: ['Wi-Fi'] });

    assert.equal(matchesTags(shop, undefined as any), true);
  });

  test('単一タグでマッチする', () => {
    const shop = createMockShop({ tags: ['Wi-Fi', 'コンセント', '静か'] });
    assert.equal(matchesTags(shop, ['Wi-Fi']), true);
  });

  test('複数タグでOR検索（いずれか一致）でマッチする', () => {
    const shop = createMockShop({ tags: ['Wi-Fi'] });
    assert.equal(matchesTags(shop, ['Wi-Fi', 'ペット可']), true);
  });

  test('タグが一つも一致しない場合マッチしない', () => {
    const shop = createMockShop({ tags: ['Wi-Fi', 'コンセント'] });
    assert.equal(matchesTags(shop, ['ペット可', '喫煙可']), false);
  });

  test('タグの大文字小文字を無視してマッチする', () => {
    const shop = createMockShop({ tags: ['WiFi', 'COFFEE'] });
    assert.equal(matchesTags(shop, ['wifi']), true);
    assert.equal(matchesTags(shop, ['coffee']), true);
  });

  test('タグの部分一致でマッチする', () => {
    const shop = createMockShop({ tags: ['無料Wi-Fi完備'] });
    assert.equal(matchesTags(shop, ['Wi-Fi']), true);
  });

  test('店舗にタグがない場合マッチしない', () => {
    const shop = createMockShop({ tags: [] });
    assert.equal(matchesTags(shop, ['Wi-Fi']), false);
  });
});

describe('filterShops', () => {
  const shops = [
    createMockShop({
      id: 'shop-1',
      name: '駅前カフェ',
      category: 'カフェ・喫茶',
      description: '静かな雰囲気',
      tags: ['Wi-Fi', 'コンセント'],
    }),
    createMockShop({
      id: 'shop-2',
      name: '本格ラーメン店',
      category: 'レストラン',
      description: '濃厚な味わい',
      tags: ['深夜営業'],
    }),
    createMockShop({
      id: 'shop-3',
      name: 'おしゃれカフェ',
      category: 'カフェ・喫茶',
      description: 'インスタ映え',
      tags: ['Wi-Fi', 'テラス席'],
    }),
  ];

  test('オプションなしで全店舗を返す', () => {
    const result = filterShops(shops);
    assert.equal(result.length, 3);
  });

  test('空のオプションで全店舗を返す', () => {
    const result = filterShops(shops, {});
    assert.equal(result.length, 3);
  });

  test('クエリで店舗名を検索できる', () => {
    const result = filterShops(shops, { query: 'カフェ' });
    assert.equal(result.length, 2);
    assert.ok(result.some(s => s.id === 'shop-1'));
    assert.ok(result.some(s => s.id === 'shop-3'));
  });

  test('クエリで説明文を検索できる', () => {
    const result = filterShops(shops, { query: '静か' });
    assert.equal(result.length, 1);
    assert.equal(result[0].id, 'shop-1');
  });

  test('クエリでタグを検索できる', () => {
    const result = filterShops(shops, { query: '深夜' });
    assert.equal(result.length, 1);
    assert.equal(result[0].id, 'shop-2');
  });

  test('カテゴリでフィルタリングできる', () => {
    const result = filterShops(shops, { category: 'カフェ・喫茶' });
    assert.equal(result.length, 2);
    assert.ok(result.every(s => s.category === 'カフェ・喫茶'));
  });

  test('タグでフィルタリングできる', () => {
    const result = filterShops(shops, { tags: ['Wi-Fi'] });
    assert.equal(result.length, 2);
    assert.ok(result.some(s => s.id === 'shop-1'));
    assert.ok(result.some(s => s.id === 'shop-3'));
  });

  test('複数タグでOR検索できる', () => {
    const result = filterShops(shops, { tags: ['テラス席', '深夜営業'] });
    assert.equal(result.length, 2);
    assert.ok(result.some(s => s.id === 'shop-2'));
    assert.ok(result.some(s => s.id === 'shop-3'));
  });

  test('複合条件（クエリ + カテゴリ）で絞り込める', () => {
    const result = filterShops(shops, {
      query: 'カフェ',
      category: 'カフェ・喫茶',
    });
    assert.equal(result.length, 2);
  });

  test('複合条件（クエリ + タグ）で絞り込める', () => {
    const result = filterShops(shops, {
      query: 'カフェ',
      tags: ['テラス席'],
    });
    assert.equal(result.length, 1);
    assert.equal(result[0].id, 'shop-3');
  });

  test('複合条件（カテゴリ + タグ）で絞り込める', () => {
    const result = filterShops(shops, {
      category: 'カフェ・喫茶',
      tags: ['コンセント'],
    });
    assert.equal(result.length, 1);
    assert.equal(result[0].id, 'shop-1');
  });

  test('全条件（クエリ + カテゴリ + タグ）で絞り込める', () => {
    const result = filterShops(shops, {
      query: 'おしゃれ',
      category: 'カフェ・喫茶',
      tags: ['Wi-Fi'],
    });
    assert.equal(result.length, 1);
    assert.equal(result[0].id, 'shop-3');
  });

  test('マッチする店舗がない場合空配列を返す', () => {
    const result = filterShops(shops, { query: '存在しない店舗' });
    assert.deepEqual(result, []);
  });

  test('空の店舗配列を渡すと空配列を返す', () => {
    const result = filterShops([], { query: 'カフェ' });
    assert.deepEqual(result, []);
  });

  test('大文字小文字を無視してクエリ検索できる', () => {
    const shopsWithEnglish = [createMockShop({ id: 'shop-en', name: 'WIFI Cafe', tags: [] })];
    const result = filterShops(shopsWithEnglish, { query: 'wifi' });
    assert.equal(result.length, 1);
    assert.equal(result[0].id, 'shop-en');
  });

  test('クエリの前後の空白を正規化して検索できる', () => {
    const result = filterShops(shops, { query: '  カフェ  ' });
    assert.equal(result.length, 2);
  });
});

describe('filterShops エッジケース', () => {
  test('nullカテゴリでは全店舗を返す', () => {
    const shops = [
      createMockShop({ id: 'shop-1', category: 'カフェ・喫茶' }),
      createMockShop({ id: 'shop-2', category: 'レストラン' }),
    ];
    const result = filterShops(shops, { category: null });
    assert.equal(result.length, 2);
  });

  test('空文字クエリでは全店舗を返す', () => {
    const shops = [createMockShop({ id: 'shop-1' }), createMockShop({ id: 'shop-2' })];
    const result = filterShops(shops, { query: '' });
    assert.equal(result.length, 2);
  });

  test('タグが空の店舗はタグフィルターに一致しない', () => {
    const shops = [
      createMockShop({ id: 'shop-1', tags: [] }),
      createMockShop({ id: 'shop-2', tags: ['Wi-Fi'] }),
    ];
    const result = filterShops(shops, { tags: ['Wi-Fi'] });
    assert.equal(result.length, 1);
    assert.equal(result[0].id, 'shop-2');
  });

  test('日本語と英語の混在検索ができる', () => {
    const shops = [createMockShop({ id: 'shop-1', name: 'WiFiカフェ', tags: [] })];
    const result = filterShops(shops, { query: 'wifi' });
    assert.equal(result.length, 1);
  });
});
