import type { ApiFavorite } from '@/lib/api';
import type { SupabaseClient } from '@supabase/supabase-js';
import assert from 'node:assert/strict';
import { afterEach, mock, test } from 'node:test';
import type { ReactElement } from 'react';
import { act, useEffect } from 'react';
import TestRenderer from 'react-test-renderer';
import {
  __resetFavoritesDependenciesForTesting,
  __setFavoritesDependenciesForTesting,
  FavoritesProvider,
  useFavorites,
} from '../FavoritesContext';

type RendererHandle = {
  unmount: () => void;
};

const createRenderer = (
  TestRenderer as unknown as {
    create: (element: ReactElement) => RendererHandle;
  }
).create;

const globalForReactAct = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};
globalForReactAct.IS_REACT_ACT_ENVIRONMENT = true;

const createSupabaseStub = (): SupabaseClient => {
  return {
    auth: {
      onAuthStateChange: (callback: unknown) => {
        void callback;
        return { data: { subscription: { unsubscribe: () => undefined } } };
      },
    },
  } as unknown as SupabaseClient;
};

const setupRemoteDependencies = () => {
  const userId = 'user-1';
  const token = 'token-1';
  const loadFavoriteId = 'shop-2';

  const resolveAuth = mock.fn(async () => ({ mode: 'remote', userId, token }) as const);
  const fetchUserFavorites = mock.fn(async (requestedUserId: string, requestedToken?: string) => {
    void requestedToken;
    return [
      {
        user_id: requestedUserId,
        store_id: loadFavoriteId,
        created_at: '2026-01-01T00:00:00.000Z',
        store: null,
      },
    ];
  });
  const addFavoriteApi = mock.fn(
    async (requestedUserId: string, storeId: string, requestedToken: string) => {
      void requestedToken;
      return {
        user_id: requestedUserId,
        store_id: storeId,
        created_at: '2026-01-01T00:00:00.000Z',
        store: null,
      };
    }
  );
  const removeFavoriteApi = mock.fn(
    async (requestedUserId: string, storeId: string, requestedToken: string) => {
      void requestedUserId;
      void storeId;
      void requestedToken;
      return undefined;
    }
  );
  const getSupabase = mock.fn(createSupabaseStub);

  __setFavoritesDependenciesForTesting({
    resolveAuth,
    fetchUserFavorites,
    addFavoriteApi,
    removeFavoriteApi,
    getSupabase,
    isSupabaseConfigured: () => false,
  });

  return {
    addFavoriteApi,
    fetchUserFavorites,
    loadFavoriteId,
    removeFavoriteApi,
    token,
    userId,
  };
};

const setupUnauthenticatedDependencies = () => {
  const resolveAuth = mock.fn(async () => ({ mode: 'unauthenticated' }) as const);
  const fetchUserFavorites = mock.fn(async (userId: string, token?: string) => {
    void userId;
    void token;
    return [];
  });
  const addFavoriteApi = mock.fn(
    async (userId: string, storeId: string, token: string): Promise<ApiFavorite> => {
      void token;
      return {
        user_id: userId,
        store_id: storeId,
        created_at: '2026-01-01T00:00:00.000Z',
        store: null,
      };
    }
  );
  const removeFavoriteApi = mock.fn(async (userId: string, storeId: string, token: string) => {
    void userId;
    void storeId;
    void token;
    return undefined;
  });
  const getSupabase = mock.fn(createSupabaseStub);

  __setFavoritesDependenciesForTesting({
    resolveAuth,
    fetchUserFavorites,
    addFavoriteApi,
    removeFavoriteApi,
    getSupabase,
    isSupabaseConfigured: () => false,
  });

  return {
    addFavoriteApi,
    fetchUserFavorites,
    removeFavoriteApi,
    resolveAuth,
  };
};

const setupLocalDependencies = () => {
  const resolveAuth = mock.fn(async () => ({ mode: 'local' }) as const);
  const fetchUserFavorites = mock.fn(async (userId: string, token?: string) => {
    void userId;
    void token;
    return [];
  });
  const addFavoriteApi = mock.fn(
    async (userId: string, storeId: string, token: string): Promise<ApiFavorite> => {
      void userId;
      void storeId;
      void token;
      return {
        user_id: 'local-user',
        store_id: 'local-store',
        created_at: '2026-01-01T00:00:00.000Z',
        store: null,
      };
    }
  );
  const removeFavoriteApi = mock.fn(async (userId: string, storeId: string, token: string) => {
    void userId;
    void storeId;
    void token;
    return undefined;
  });
  const getSupabase = mock.fn(createSupabaseStub);

  __setFavoritesDependenciesForTesting({
    resolveAuth,
    fetchUserFavorites,
    addFavoriteApi,
    removeFavoriteApi,
    getSupabase,
    isSupabaseConfigured: () => false,
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

const createFavoritesHarness = () => {
  let currentValue: ReturnType<typeof useFavorites> | undefined;
  let renderer: RendererHandle | undefined;

  const handleValue = (value: ReturnType<typeof useFavorites>) => {
    currentValue = value;
  };

  const Consumer = ({ onValue }: { onValue: (value: ReturnType<typeof useFavorites>) => void }) => {
    const value = useFavorites();

    useEffect(() => {
      onValue(value);
    }, [onValue, value]);

    return null;
  };

  act(() => {
    renderer = createRenderer(
      <FavoritesProvider>
        <Consumer onValue={handleValue} />
      </FavoritesProvider>
    );
  });

  if (!currentValue || !renderer) {
    throw new Error('FavoritesProvider setup failed');
  }

  return {
    getValue: () => {
      if (!currentValue) {
        throw new Error('FavoritesProvider setup failed');
      }

      return currentValue;
    },
    unmount: () => {
      act(() => {
        renderer!.unmount();
      });
    },
  };
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
  const { addFavoriteApi, token, userId } = setupRemoteDependencies();
  const { getValue, unmount } = createFavoritesHarness();

  await act(async () => {
    await getValue().addFavorite('shop-1');
  });

  assert.equal(addFavoriteApi.mock.calls.length, 1);
  assert.deepEqual(addFavoriteApi.mock.calls[0].arguments, [userId, 'shop-1', token]);
  assert.equal(getValue().isFavorite('shop-1'), true);
  assert.equal(getValue().favorites.has('shop-1'), true);

  unmount();
});

test('removeFavorite removes a shop from favorites', async () => {
  const { fetchUserFavorites, loadFavoriteId, removeFavoriteApi, token, userId } =
    setupRemoteDependencies();
  const { getValue, unmount } = createFavoritesHarness();

  await act(async () => {
    await getValue().loadFavorites();
  });

  await act(async () => {
    await getValue().removeFavorite(loadFavoriteId);
  });

  assert.equal(fetchUserFavorites.mock.calls.length, 1);
  assert.deepEqual(fetchUserFavorites.mock.calls[0].arguments, [userId, token]);
  assert.equal(removeFavoriteApi.mock.calls.length, 1);
  assert.deepEqual(removeFavoriteApi.mock.calls[0].arguments, [userId, loadFavoriteId, token]);
  assert.equal(getValue().isFavorite(loadFavoriteId), false);
  assert.equal(getValue().favorites.has(loadFavoriteId), false);

  unmount();
});

test('toggleFavorite adds and removes a shop', async () => {
  const { addFavoriteApi, removeFavoriteApi, token, userId } = setupRemoteDependencies();
  const { getValue, unmount } = createFavoritesHarness();

  await act(async () => {
    await getValue().toggleFavorite('shop-3');
  });

  assert.equal(getValue().isFavorite('shop-3'), true);
  assert.equal(addFavoriteApi.mock.calls.length, 1);
  assert.deepEqual(addFavoriteApi.mock.calls[0].arguments, [userId, 'shop-3', token]);

  await act(async () => {
    await getValue().toggleFavorite('shop-3');
  });

  assert.equal(getValue().isFavorite('shop-3'), false);
  assert.equal(removeFavoriteApi.mock.calls.length, 1);
  assert.deepEqual(removeFavoriteApi.mock.calls[0].arguments, [userId, 'shop-3', token]);

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
    (err: unknown) => err instanceof Error && err.message === 'auth_required'
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
    (err: unknown) => err instanceof Error && err.message === 'auth_required'
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
    (err: unknown) => err instanceof Error && err.message === 'auth_required'
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
