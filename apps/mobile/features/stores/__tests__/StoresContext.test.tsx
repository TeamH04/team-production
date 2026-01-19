import assert from 'node:assert/strict';
import { afterEach, describe, mock, test } from 'node:test';

import React from 'react';

import {
  act,
  createContextHarness,
  createMockShop,
  flushPromises,
  shopToApiStore,
  type ContextHarness,
} from '@/test-utils';

import {
  __resetStoresDependenciesForTesting,
  __setStoresDependenciesForTesting,
  StoresProvider,
  useStores,
} from '../StoresContext';

import type { ApiStore } from '@/lib/api';

const setupDependencies = (
  options: { stores?: ReturnType<typeof createMockShop>[]; shouldFail?: boolean } = {},
) => {
  const {
    stores = [
      createMockShop({ id: '1', name: 'Shop 1' }),
      createMockShop({ id: '2', name: 'Shop 2' }),
    ],
    shouldFail = false,
  } = options;

  const apiStores = stores.map(shopToApiStore);

  const fetchStores = mock.fn(async () => {
    if (shouldFail) {
      throw new Error('API Error');
    }
    return apiStores;
  });

  const mapStores = mock.fn((input: ApiStore[]) =>
    input.map(apiStore => {
      const matchingShop = stores.find(s => s.id === apiStore.store_id);
      return matchingShop ?? createMockShop({ id: apiStore.store_id, name: apiStore.name });
    }),
  );

  __setStoresDependenciesForTesting({
    fetchStores,
    mapStores,
  });

  return { fetchStores, mapStores, stores, apiStores };
};

afterEach(() => {
  __resetStoresDependenciesForTesting();
  mock.restoreAll();
});

describe('StoresContext', () => {
  test('useStores throws outside StoresProvider', () => {
    setupDependencies();

    assert.throws(() => {
      createContextHarness(useStores, ({ children }) => <>{children}</>);
    }, /useStores must be used within StoresProvider/);
  });

  describe('初期化', () => {
    test('初期マウント時にfetchStoresが呼ばれ店舗が設定される', async () => {
      const mockStores = [createMockShop({ id: 'test-1', name: 'Test Shop 1' })];
      const { fetchStores } = setupDependencies({ stores: mockStores });
      const harness: ContextHarness<ReturnType<typeof useStores>> = createContextHarness(
        useStores,
        StoresProvider,
      );

      await act(async () => {
        await flushPromises();
      });

      assert.equal(fetchStores.mock.calls.length, 1);
      assert.equal(harness.getValue().stores.length, 1);
      assert.equal(harness.getValue().stores[0].id, 'test-1');
      harness.unmount();
    });

    test('複数店舗が正しく設定される', async () => {
      const mockStores = [
        createMockShop({ id: 'shop-1', name: 'Shop 1', category: 'カフェ・喫茶' }),
        createMockShop({ id: 'shop-2', name: 'Shop 2', category: 'レストラン' }),
        createMockShop({ id: 'shop-3', name: 'Shop 3', category: 'バー・居酒屋' }),
      ];
      setupDependencies({ stores: mockStores });
      const harness: ContextHarness<ReturnType<typeof useStores>> = createContextHarness(
        useStores,
        StoresProvider,
      );

      await act(async () => {
        await flushPromises();
      });

      assert.equal(harness.getValue().stores.length, 3);
      harness.unmount();
    });
  });

  describe('ローディング状態', () => {
    test('初期状態でloadingがtrue', () => {
      setupDependencies();
      const harness: ContextHarness<ReturnType<typeof useStores>> = createContextHarness(
        useStores,
        StoresProvider,
      );

      assert.equal(harness.getValue().loading, true);
      harness.unmount();
    });

    test('取得完了後にloadingがfalse', async () => {
      setupDependencies();
      const harness: ContextHarness<ReturnType<typeof useStores>> = createContextHarness(
        useStores,
        StoresProvider,
      );

      await act(async () => {
        await flushPromises();
      });

      assert.equal(harness.getValue().loading, false);
      harness.unmount();
    });
  });

  describe('エラーハンドリング', () => {
    test('Errorオブジェクトの場合はメッセージが設定される', async () => {
      setupDependencies({ shouldFail: true });
      const harness: ContextHarness<ReturnType<typeof useStores>> = createContextHarness(
        useStores,
        StoresProvider,
      );

      await act(async () => {
        await flushPromises();
      });

      assert.equal(harness.getValue().error, 'API Error');
      assert.equal(harness.getValue().loading, false);
      harness.unmount();
    });

    test('非Errorオブジェクトの場合はデフォルトメッセージが設定される', async () => {
      const fetchStores = mock.fn(async () => {
        throw 'string error';
      });
      const mapStores = mock.fn((input: ApiStore[]) => input.map(() => createMockShop()));

      __setStoresDependenciesForTesting({ fetchStores, mapStores });

      const harness: ContextHarness<ReturnType<typeof useStores>> = createContextHarness(
        useStores,
        StoresProvider,
      );

      await act(async () => {
        await flushPromises();
      });

      assert.ok(harness.getValue().error);
      assert.equal(harness.getValue().loading, false);
      harness.unmount();
    });
  });

  describe('refresh', () => {
    test('refreshで再取得する', async () => {
      const { fetchStores } = setupDependencies();
      const harness: ContextHarness<ReturnType<typeof useStores>> = createContextHarness(
        useStores,
        StoresProvider,
      );

      await act(async () => {
        await flushPromises();
      });

      assert.equal(fetchStores.mock.calls.length, 1);

      await act(async () => {
        await harness.getValue().refresh();
      });

      assert.equal(fetchStores.mock.calls.length, 2);
      harness.unmount();
    });
  });

  describe('getStoreById', () => {
    test('店舗を検索できる', async () => {
      const mockStores = [
        createMockShop({ id: 'shop-1', name: 'Shop 1' }),
        createMockShop({ id: 'shop-2', name: 'Shop 2' }),
      ];
      setupDependencies({ stores: mockStores });
      const harness: ContextHarness<ReturnType<typeof useStores>> = createContextHarness(
        useStores,
        StoresProvider,
      );

      await act(async () => {
        await flushPromises();
      });

      const found = harness.getValue().getStoreById('shop-1');
      assert.equal(found?.id, 'shop-1');
      assert.equal(found?.name, 'Shop 1');
      harness.unmount();
    });

    test('存在しないIDはundefinedを返す', async () => {
      setupDependencies();
      const harness: ContextHarness<ReturnType<typeof useStores>> = createContextHarness(
        useStores,
        StoresProvider,
      );

      await act(async () => {
        await flushPromises();
      });

      const notFound = harness.getValue().getStoreById('non-existent');
      assert.equal(notFound, undefined);
      harness.unmount();
    });

    test('空文字のIDはundefinedを返す', async () => {
      setupDependencies();
      const harness: ContextHarness<ReturnType<typeof useStores>> = createContextHarness(
        useStores,
        StoresProvider,
      );

      await act(async () => {
        await flushPromises();
      });

      const notFound = harness.getValue().getStoreById('');
      assert.equal(notFound, undefined);
      harness.unmount();
    });
  });
});
