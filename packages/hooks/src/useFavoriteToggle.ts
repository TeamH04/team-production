import { toggleArrayItem, addToArray, removeFromArray } from '@team/core-utils';
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
  return toggleArrayItem(ids, id);
}

/**
 * Add an ID to a list if not already present
 */
export function addFavoriteId(ids: string[], id: string): string[] {
  return addToArray(ids, id);
}

/**
 * Remove an ID from a list
 */
export function removeFavoriteId(ids: string[], id: string): string[] {
  return removeFromArray(ids, id);
}

/**
 * シンプルなお気に入りトグル機能を提供するフック
 *
 * ローカル状態のみを管理し、APIとの同期は行いません。
 * localStorage や React の状態管理と組み合わせて使用できます。
 *
 * ## 特徴
 * - 同期的な状態更新（APIコールなし）
 * - 軽量で依存関係が少ない
 * - カスタム状態形状に対応
 *
 * ## useFavoritesState との違い
 * | 機能 | useFavoriteToggle | useFavoritesState |
 * |------|-------------------|-------------------|
 * | API連携 | なし | あり |
 * | 楽観的更新 | なし | あり |
 * | 認証対応 | なし | あり |
 * | レースコンディション対策 | なし | あり |
 * | 操作中状態の追跡 | なし | あり |
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
 *
 * @see useFavoritesState API連携と楽観的更新が必要な場合はこちらを使用
 */
export function useFavoriteToggle<T = string[]>({
  favorites,
  setFavorites,
  getFavoriteIds = (state: T) => state as unknown as string[],
  createNewState = (_state: T, ids: string[]) => ids as unknown as T,
}: UseFavoriteToggleOptions<T>): UseFavoriteToggleResult {
  const favoriteIds = useMemo(() => getFavoriteIds(favorites), [favorites, getFavoriteIds]);

  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);
  const isFavorite = useCallback((id: string) => favoriteSet.has(id), [favoriteSet]);

  // Factory function to create favorite action callbacks
  const createFavoriteAction = useCallback(
    (operationFn: (ids: string[], id: string) => string[]) => (id: string) => {
      setFavorites(prev => {
        const currentIds = getFavoriteIds(prev);
        const newIds = operationFn(currentIds, id);
        return createNewState(prev, newIds);
      });
    },
    [setFavorites, getFavoriteIds, createNewState],
  );

  const toggleFavorite = useMemo(
    () => createFavoriteAction(toggleFavoriteId),
    [createFavoriteAction],
  );
  const addFavorite = useMemo(() => createFavoriteAction(addFavoriteId), [createFavoriteAction]);
  const removeFavorite = useMemo(
    () => createFavoriteAction(removeFavoriteId),
    [createFavoriteAction],
  );

  return useMemo(
    () => ({
      isFavorite,
      toggleFavorite,
      addFavorite,
      removeFavorite,
    }),
    [isFavorite, toggleFavorite, addFavorite, removeFavorite],
  );
}
