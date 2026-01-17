import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { fetchStores as fetchStoresApi } from '@/lib/api';
import { mapApiStoresToShops as mapApiStoresToShopsDefault } from '@/lib/storeMapping';

import type { Shop } from '@team/shop-core';

type StoresDependencies = {
  fetchStores: typeof fetchStoresApi;
  mapApiStoresToShops: typeof mapApiStoresToShopsDefault;
};

const defaultDependencies: StoresDependencies = {
  fetchStores: fetchStoresApi,
  mapApiStoresToShops: mapApiStoresToShopsDefault,
};

let dependencies = defaultDependencies;

export function __setStoresDependenciesForTesting(overrides: Partial<StoresDependencies>): void {
  dependencies = { ...defaultDependencies, ...overrides };
}

export function __resetStoresDependenciesForTesting(): void {
  dependencies = defaultDependencies;
}

type StoresContextValue = {
  stores: Shop[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getStoreById: (id: string) => Shop | undefined;
};

const StoresContext = createContext<StoresContextValue | undefined>(undefined);

export function StoresProvider({ children }: { children: React.ReactNode }) {
  const [stores, setStores] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dependencies.fetchStores();
      setStores(dependencies.mapApiStoresToShops(data));
    } catch (err) {
      const message = err instanceof Error ? err.message : '店舗情報の取得に失敗しました';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const getStoreById = useCallback((id: string) => stores.find(store => store.id === id), [stores]);

  const value = useMemo<StoresContextValue>(
    () => ({
      stores,
      loading,
      error,
      refresh,
      getStoreById,
    }),
    [error, getStoreById, loading, refresh, stores],
  );

  return <StoresContext.Provider value={value}>{children}</StoresContext.Provider>;
}

export function useStores() {
  const ctx = useContext(StoresContext);
  if (!ctx) throw new Error('useStores must be used within StoresProvider');
  return ctx;
}
