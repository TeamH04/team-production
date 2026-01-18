import assert from 'node:assert/strict';
import { afterEach, describe, mock, test } from 'node:test';

import React from 'react';

import {
  act,
  createContextHarness,
  createMockApiCall,
  createMockAuth,
  createMockFetch,
  createMockGetSupabase,
  createMockIsSupabaseConfigured,
  createRenderer,
  type ContextHarness,
} from '@/test-utils';

import {
  __resetFavoritesDependenciesForTesting,
  __setFavoritesDependenciesForTesting,
  FavoritesProvider,
  useFavorites,
} from '../FavoritesContext';

import type { ApiFavorite } from '@/lib/api';

const setupRemoteDependencies = () => {
  const token = 'token-1';
  const loadFavoriteId = 'shop-2';

  const resolveAuth = createMockAuth({ mode: 'remote', token });
  const fetchUserFavorites = createMockFetch<ApiFavorite[]>([
    {
      user_id: 'remote-user',
      store_id: loadFavoriteId,
      created_at: '2026-01-01T00:00:00.000Z',
      store: null,
    },
  ]);
  const addFavoriteApi = createMockApiCall<ApiFavorite, [string, string]>(storeId => ({
    user_id: 'remote-user',
    store_id: storeId,
    created_at: '2026-01-01T00:00:00.000Z',
    store: null,
  }));
  const removeFavoriteApi = createMockApiCall<void, [string, string]>();
  const getSupabase = createMockGetSupabase();

  __setFavoritesDependenciesForTesting({
    resolveAuth,
    fetchUserFavorites,
    addFavoriteApi,
    removeFavoriteApi,
    getSupabase,
    isSupabaseConfigured: createMockIsSupabaseConfigured(false),
  });

  return {
    addFavoriteApi,
    fetchUserFavorites,
    loadFavoriteId,
    removeFavoriteApi,
    token,
  };
};

const setupUnauthenticatedDependencies = () => {
  const resolveAuth = createMockAuth({ mode: 'unauthenticated' });
  const fetchUserFavorites = createMockFetch<ApiFavorite[]>([]);
  const addFavoriteApi = createMockApiCall<ApiFavorite, [string, string]>(storeId => ({
    user_id: 'unauth-user',
    store_id: storeId,
    created_at: '2026-01-01T00:00:00.000Z',
    store: null,
  }));
  const removeFavoriteApi = createMockApiCall<void, [string, string]>();
  const getSupabase = createMockGetSupabase();

  __setFavoritesDependenciesForTesting({
    resolveAuth,
    fetchUserFavorites,
    addFavoriteApi,
    removeFavoriteApi,
    getSupabase,
    isSupabaseConfigured: createMockIsSupabaseConfigured(false),
  });

  return {
    addFavoriteApi,
    fetchUserFavorites,
    removeFavoriteApi,
    resolveAuth,
  };
};

const setupLocalDependencies = () => {
  const resolveAuth = createMockAuth({ mode: 'local' });
  const fetchUserFavorites = createMockFetch<ApiFavorite[]>([]);
  const addFavoriteApi = createMockApiCall<ApiFavorite, [string, string]>(() => ({
    user_id: 'local-user',
    store_id: 'local-store',
    created_at: '2026-01-01T00:00:00.000Z',
    store: null,
  }));
  const removeFavoriteApi = createMockApiCall<void, [string, string]>();
  const getSupabase = createMockGetSupabase();

  __setFavoritesDependenciesForTesting({
    resolveAuth,
    fetchUserFavorites,
    addFavoriteApi,
    removeFavoriteApi,
    getSupabase,
    isSupabaseConfigured: createMockIsSupabaseConfigured(false),
  });

  return {
    addFavoriteApi,
    fetchUserFavorites,
    removeFavoriteApi,
  };
};

afterEach(() => {
  __resetFavoritesDependenciesForTesting();
  mock.restoreAll();
});

const createFavoritesHarness = (): ContextHarness<ReturnType<typeof useFavorites>> => {
  return createContextHarness(useFavorites, FavoritesProvider);
};

describe('FavoritesContext', () => {
  test('useFavorites throws outside FavoritesProvider', () => {
    const Consumer = () => {
      useFavorites();
      return null;
    };

    assert.throws(() => {
      act(() => {
        createRenderer(<Consumer />);
      });
    }, /useFavorites must be used within FavoritesProvider/);
  });

  describe('リモートモード', () => {
    describe('addFavorite', () => {
      test('店舗をお気に入りに追加する', async () => {
        const { addFavoriteApi } = setupRemoteDependencies();
        const { getValue, unmount } = createFavoritesHarness();

        await act(async () => {
          await getValue().addFavorite('shop-1');
        });

        assert.equal(addFavoriteApi.mock.calls.length, 1);
        assert.equal(getValue().isFavorite('shop-1'), true);

        unmount();
      });

      test('APIエラー時にロールバックされる', async () => {
        const { addFavoriteApi } = setupRemoteDependencies();
        addFavoriteApi.mock.mockImplementation(async () => {
          throw new Error('API Error');
        });
        const { getValue, unmount } = createFavoritesHarness();

        await assert.rejects(
          async () => {
            await act(async () => {
              await getValue().addFavorite('shop-1');
            });
          },
          (err: unknown) => err instanceof Error && err.message === 'API Error',
        );

        assert.equal(getValue().isFavorite('shop-1'), false);
        assert.equal(getValue().isOperationPending('shop-1'), false);

        unmount();
      });
    });

    describe('removeFavorite', () => {
      test('お気に入りから店舗を削除する', async () => {
        const { loadFavoriteId, removeFavoriteApi } = setupRemoteDependencies();
        const { getValue, unmount } = createFavoritesHarness();

        await act(async () => {
          await getValue().loadFavorites();
        });

        await act(async () => {
          await getValue().removeFavorite(loadFavoriteId);
        });

        assert.equal(removeFavoriteApi.mock.calls.length, 1);
        assert.equal(getValue().isFavorite(loadFavoriteId), false);

        unmount();
      });
    });

    describe('toggleFavorite', () => {
      test('未登録の店舗を追加する', async () => {
        const { addFavoriteApi } = setupRemoteDependencies();
        const { getValue, unmount } = createFavoritesHarness();

        await act(async () => {
          await getValue().toggleFavorite('shop-3');
        });

        assert.equal(getValue().isFavorite('shop-3'), true);
        assert.equal(addFavoriteApi.mock.calls.length, 1);

        unmount();
      });

      test('登録済みの店舗を削除する', async () => {
        const { removeFavoriteApi } = setupRemoteDependencies();
        const { getValue, unmount } = createFavoritesHarness();

        await act(async () => {
          await getValue().toggleFavorite('shop-3');
        });

        await act(async () => {
          await getValue().toggleFavorite('shop-3');
        });

        assert.equal(getValue().isFavorite('shop-3'), false);
        assert.equal(removeFavoriteApi.mock.calls.length, 1);

        unmount();
      });
    });

    describe('loadFavorites', () => {
      test('お気に入り一覧を読み込む', async () => {
        const { fetchUserFavorites, loadFavoriteId } = setupRemoteDependencies();
        const { getValue, unmount } = createFavoritesHarness();

        await act(async () => {
          await getValue().loadFavorites();
        });

        assert.equal(fetchUserFavorites.mock.calls.length, 1);
        assert.equal(getValue().isFavorite(loadFavoriteId), true);

        unmount();
      });
    });
  });

  describe('未認証モード', () => {
    test('removeFavoriteでauth_requiredエラー', async () => {
      const { removeFavoriteApi } = setupUnauthenticatedDependencies();
      const { getValue, unmount } = createFavoritesHarness();

      await assert.rejects(
        async () => {
          await act(async () => {
            await getValue().removeFavorite('shop-4');
          });
        },
        (err: unknown) => err instanceof Error && err.message === 'auth_required',
      );

      assert.equal(removeFavoriteApi.mock.calls.length, 0);

      unmount();
    });

    test('addFavoriteでauth_requiredエラー', async () => {
      const { addFavoriteApi } = setupUnauthenticatedDependencies();
      const { getValue, unmount } = createFavoritesHarness();

      await assert.rejects(
        async () => {
          await act(async () => {
            await getValue().addFavorite('shop-5');
          });
        },
        (err: unknown) => err instanceof Error && err.message === 'auth_required',
      );

      assert.equal(addFavoriteApi.mock.calls.length, 0);

      unmount();
    });

    test('toggleFavoriteでauth_requiredエラー', async () => {
      const { addFavoriteApi, removeFavoriteApi } = setupUnauthenticatedDependencies();
      const { getValue, unmount } = createFavoritesHarness();

      await assert.rejects(
        async () => {
          await act(async () => {
            await getValue().toggleFavorite('shop-6');
          });
        },
        (err: unknown) => err instanceof Error && err.message === 'auth_required',
      );

      assert.equal(addFavoriteApi.mock.calls.length, 0);
      assert.equal(removeFavoriteApi.mock.calls.length, 0);

      unmount();
    });
  });

  describe('ローカルモード', () => {
    test('addFavoriteがAPI呼び出しなしでローカル状態を更新する', async () => {
      const { addFavoriteApi } = setupLocalDependencies();
      const { getValue, unmount } = createFavoritesHarness();

      await act(async () => {
        await getValue().addFavorite('shop-7');
      });

      assert.equal(addFavoriteApi.mock.calls.length, 0);
      assert.equal(getValue().isFavorite('shop-7'), true);

      unmount();
    });

    test('removeFavoriteがAPI呼び出しなしでローカル状態を更新する', async () => {
      const { addFavoriteApi, removeFavoriteApi } = setupLocalDependencies();
      const { getValue, unmount } = createFavoritesHarness();

      await act(async () => {
        await getValue().addFavorite('shop-8');
      });

      await act(async () => {
        await getValue().removeFavorite('shop-8');
      });

      assert.equal(addFavoriteApi.mock.calls.length, 0);
      assert.equal(removeFavoriteApi.mock.calls.length, 0);
      assert.equal(getValue().isFavorite('shop-8'), false);

      unmount();
    });

    test('toggleFavoriteがAPI呼び出しなしでローカル状態を更新する', async () => {
      const { addFavoriteApi, removeFavoriteApi } = setupLocalDependencies();
      const { getValue, unmount } = createFavoritesHarness();

      await act(async () => {
        await getValue().toggleFavorite('shop-9');
      });

      assert.equal(getValue().isFavorite('shop-9'), true);

      await act(async () => {
        await getValue().toggleFavorite('shop-9');
      });

      assert.equal(addFavoriteApi.mock.calls.length, 0);
      assert.equal(removeFavoriteApi.mock.calls.length, 0);
      assert.equal(getValue().isFavorite('shop-9'), false);

      unmount();
    });
  });

  describe('エッジケース', () => {
    test('空文字の店舗IDでも動作する', async () => {
      setupLocalDependencies();
      const { getValue, unmount } = createFavoritesHarness();

      await act(async () => {
        await getValue().addFavorite('');
      });

      assert.equal(getValue().isFavorite(''), true);

      unmount();
    });

    test('同じ店舗を複数回追加しても1つだけ登録される', async () => {
      setupLocalDependencies();
      const { getValue, unmount } = createFavoritesHarness();

      await act(async () => {
        await getValue().addFavorite('shop-1');
        await getValue().addFavorite('shop-1');
      });

      assert.equal(getValue().favorites.size, 1);

      unmount();
    });
  });
});
