import assert from 'node:assert/strict';
import { afterEach, mock, test } from 'node:test';

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

/**
 * FavoritesContext用のテストハーネスを作成
 * 共通のcreateContextHarnessユーティリティを使用
 */
const createFavoritesHarness = (): ContextHarness<ReturnType<typeof useFavorites>> => {
  return createContextHarness(useFavorites, FavoritesProvider);
};

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

test('addFavorite marks a shop as favorite', async () => {
  const { addFavoriteApi, token } = setupRemoteDependencies();
  const { getValue, unmount } = createFavoritesHarness();

  await act(async () => {
    await getValue().addFavorite('shop-1');
  });

  assert.equal(addFavoriteApi.mock.calls.length, 1);
  assert.deepEqual(addFavoriteApi.mock.calls[0].arguments, ['shop-1', token]);
  assert.equal(getValue().isFavorite('shop-1'), true);
  assert.equal(getValue().favorites.has('shop-1'), true);

  unmount();
});

test('addFavorite でAPIエラー時にロールバックされる', async () => {
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

test('removeFavorite removes a shop from favorites', async () => {
  const { fetchUserFavorites, loadFavoriteId, removeFavoriteApi, token } =
    setupRemoteDependencies();
  const { getValue, unmount } = createFavoritesHarness();

  await act(async () => {
    await getValue().loadFavorites();
  });

  await act(async () => {
    await getValue().removeFavorite(loadFavoriteId);
  });

  assert.equal(fetchUserFavorites.mock.calls.length, 1);
  assert.deepEqual(fetchUserFavorites.mock.calls[0].arguments, [token]);
  assert.equal(removeFavoriteApi.mock.calls.length, 1);
  assert.deepEqual(removeFavoriteApi.mock.calls[0].arguments, [loadFavoriteId, token]);
  assert.equal(getValue().isFavorite(loadFavoriteId), false);
  assert.equal(getValue().favorites.has(loadFavoriteId), false);

  unmount();
});

test('toggleFavorite adds and removes a shop', async () => {
  const { addFavoriteApi, removeFavoriteApi, token } = setupRemoteDependencies();
  const { getValue, unmount } = createFavoritesHarness();

  await act(async () => {
    await getValue().toggleFavorite('shop-3');
  });

  assert.equal(getValue().isFavorite('shop-3'), true);
  assert.equal(addFavoriteApi.mock.calls.length, 1);
  assert.deepEqual(addFavoriteApi.mock.calls[0].arguments, ['shop-3', token]);

  await act(async () => {
    await getValue().toggleFavorite('shop-3');
  });

  assert.equal(getValue().isFavorite('shop-3'), false);
  assert.equal(removeFavoriteApi.mock.calls.length, 1);
  assert.deepEqual(removeFavoriteApi.mock.calls[0].arguments, ['shop-3', token]);

  unmount();
});

test('removeFavorite throws auth_required when unauthenticated', async () => {
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

test('addFavorite throws auth_required when unauthenticated', async () => {
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

test('toggleFavorite throws auth_required when unauthenticated', async () => {
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

test('addFavorite updates state locally without API calls', async () => {
  const { addFavoriteApi } = setupLocalDependencies();
  const { getValue, unmount } = createFavoritesHarness();

  await act(async () => {
    await getValue().addFavorite('shop-7');
  });

  assert.equal(addFavoriteApi.mock.calls.length, 0);
  assert.equal(getValue().isFavorite('shop-7'), true);

  unmount();
});

test('removeFavorite updates state locally without API calls', async () => {
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

test('toggleFavorite updates state locally without API calls', async () => {
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
