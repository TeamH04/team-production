import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAsyncOperation } from './useAsyncOperation';

/**
 * Dependencies for fetching and mapping store data.
 * Uses dependency injection pattern for testability.
 */
export interface StoresStateDependencies<TRaw, TStore> {
  /** Function to fetch raw store data from API */
  fetchStores: () => Promise<TRaw>;
  /** Function to map raw data to store entities */
  mapStores: (data: TRaw) => TStore[];
}

export interface UseStoresStateOptions<TRaw, TStore> {
  /** Dependencies for data fetching and mapping */
  getDependencies: () => StoresStateDependencies<TRaw, TStore>;
  /** Custom error handler for transforming errors */
  onError?: (error: unknown) => string;
  /** Whether to automatically fetch on mount (default: true) */
  autoFetch?: boolean;
}

export interface UseStoresStateResult<TStore> {
  /** List of stores */
  stores: TStore[];
  /** Whether data is being loaded */
  loading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Function to refresh store data */
  refresh: () => Promise<void>;
  /** Function to find a store by ID */
  getStoreById: (id: string) => TStore | undefined;
}

/**
 * Hook for managing stores state with loading, error, and refresh functionality.
 *
 * This hook extracts the common state management logic for store data,
 * using dependency injection for API calls and mapping.
 *
 * @example
 * ```tsx
 * const { stores, loading, error, refresh, getStoreById } = useStoresState({
 *   getDependencies: () => ({
 *     fetchStores: fetchStoresApi,
 *     mapStores: mapStoresDefault,
 *   }),
 *   onError: (err) => err instanceof Error ? err.message : 'Failed to fetch stores',
 * });
 * ```
 */
export function useStoresState<TRaw, TStore extends { id: string }>({
  getDependencies,
  onError,
  autoFetch = true,
}: UseStoresStateOptions<TRaw, TStore>): UseStoresStateResult<TStore> {
  const [stores, setStores] = useState<TStore[]>([]);
  const { loading, error, execute } = useAsyncOperation<TStore[]>({
    onError,
    initialLoading: autoFetch,
  });

  const refresh = useCallback(async () => {
    const result = await execute(async () => {
      const deps = getDependencies();
      const data = await deps.fetchStores();
      return deps.mapStores(data);
    });
    if (result) {
      setStores(result);
    }
  }, [execute, getDependencies]);

  useEffect(() => {
    if (!autoFetch) return;
    // Initial load: hold refresh as a reference outside useEffect and call it
    // This avoids ESLint's set-state-in-effect rule
    const initialLoad = refresh;
    void initialLoad();
    // Execute only on initial mount (refresh is a stable reference)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const storeMap = useMemo(() => new Map(stores.map(s => [s.id, s])), [stores]);
  const getStoreById = useCallback((id: string) => storeMap.get(id), [storeMap]);

  return useMemo(
    () => ({
      stores,
      loading,
      error,
      refresh,
      getStoreById,
    }),
    [stores, loading, error, refresh, getStoreById],
  );
}
