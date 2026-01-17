import { ERROR_MESSAGES } from '@team/constants';
import { createDependencyInjector, createSafeContext } from '@team/core-utils';
import { useStoresState } from '@team/hooks';
import React, { useCallback } from 'react';

import { api } from '@/lib/api';
import { storage } from '@/lib/storage';

import type { Shop } from '@team/shop-core';

type StoresDependencies = {
  fetchStores: typeof api.fetchStores;
  mapStores: typeof storage.mapStores;
};

const dependencyInjector = createDependencyInjector<StoresDependencies>({
  fetchStores: api.fetchStores,
  mapStores: storage.mapStores,
});

export const __setStoresDependenciesForTesting = dependencyInjector.setForTesting;
export const __resetStoresDependenciesForTesting = dependencyInjector.reset;

type StoresContextValue = {
  stores: Shop[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getStoreById: (id: string) => Shop | undefined;
};

const [StoresContextProvider, useStores] = createSafeContext<StoresContextValue>('Stores');

export { useStores };

const handleError = (err: unknown) =>
  err instanceof Error ? err.message : ERROR_MESSAGES.STORE_FETCH_FAILED;

export function StoresProvider({ children }: { children: React.ReactNode }) {
  const getDependencies = useCallback(() => dependencyInjector.get(), []);

  const storesState = useStoresState<Awaited<ReturnType<typeof api.fetchStores>>, Shop>({
    getDependencies,
    onError: handleError,
  });

  return <StoresContextProvider value={storesState}>{children}</StoresContextProvider>;
}
