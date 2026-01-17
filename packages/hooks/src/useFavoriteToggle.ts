import { useCallback, useMemo } from 'react';

/**
 * Favorite toggle hook configuration
 */
export type UseFavoriteToggleOptions<T = string[]> = {
  /** Current favorites state */
  favorites: T;
  /** Function to update favorites state */
  setFavorites: (updater: (prev: T) => T) => void;
  /** Get current favorite IDs from the state (for custom state shapes) */
  getFavoriteIds?: (state: T) => string[];
  /** Create new state with updated favorite IDs (for custom state shapes) */
  createNewState?: (state: T, ids: string[]) => T;
};

/**
 * Return type of useFavoriteToggle hook
 */
export type UseFavoriteToggleResult = {
  /** Check if an item is in favorites */
  isFavorite: (id: string) => boolean;
  /** Toggle an item's favorite status */
  toggleFavorite: (id: string) => void;
  /** Add an item to favorites */
  addFavorite: (id: string) => void;
  /** Remove an item from favorites */
  removeFavorite: (id: string) => void;
};

/**
 * Toggle logic for adding/removing an ID from a list
 */
export function toggleFavoriteId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter(existingId => existingId !== id) : [...ids, id];
}

/**
 * Add an ID to a list if not already present
 */
export function addFavoriteId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids : [...ids, id];
}

/**
 * Remove an ID from a list
 */
export function removeFavoriteId(ids: string[], id: string): string[] {
  return ids.filter(existingId => existingId !== id);
}

/**
 * Hook for managing favorite toggle state with localStorage or any state management
 *
 * @example
 * // Simple usage with string array (Web with localStorage)
 * const [favorites, setFavorites] = useLocalStorage<string[]>('favorites', []);
 * const { isFavorite, toggleFavorite } = useFavoriteToggle({ favorites, setFavorites });
 *
 * @example
 * // Usage with custom state shape
 * const { isFavorite, toggleFavorite } = useFavoriteToggle({
 *   favorites: customState,
 *   setFavorites: setCustomState,
 *   getFavoriteIds: (state) => state.ids,
 *   createNewState: (state, ids) => ({ ...state, ids }),
 * });
 */
export function useFavoriteToggle<T = string[]>({
  favorites,
  setFavorites,
  getFavoriteIds = (state: T) => state as unknown as string[],
  createNewState = (_state: T, ids: string[]) => ids as unknown as T,
}: UseFavoriteToggleOptions<T>): UseFavoriteToggleResult {
  const favoriteIds = useMemo(() => getFavoriteIds(favorites), [favorites, getFavoriteIds]);

  const isFavorite = useCallback((id: string) => favoriteIds.includes(id), [favoriteIds]);

  const toggleFavorite = useCallback(
    (id: string) => {
      setFavorites(prev => {
        const currentIds = getFavoriteIds(prev);
        const newIds = toggleFavoriteId(currentIds, id);
        return createNewState(prev, newIds);
      });
    },
    [setFavorites, getFavoriteIds, createNewState],
  );

  const addFavorite = useCallback(
    (id: string) => {
      setFavorites(prev => {
        const currentIds = getFavoriteIds(prev);
        const newIds = addFavoriteId(currentIds, id);
        return createNewState(prev, newIds);
      });
    },
    [setFavorites, getFavoriteIds, createNewState],
  );

  const removeFavorite = useCallback(
    (id: string) => {
      setFavorites(prev => {
        const currentIds = getFavoriteIds(prev);
        const newIds = removeFavoriteId(currentIds, id);
        return createNewState(prev, newIds);
      });
    },
    [setFavorites, getFavoriteIds, createNewState],
  );

  return {
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
  };
}
