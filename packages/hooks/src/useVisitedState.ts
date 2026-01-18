import { useCallback, useMemo } from 'react';

import { useSetState } from './useSetState';

/**
 * Visited state hook configuration
 */
export type UseVisitedStateOptions = {
  /** Initial visited IDs */
  initialVisited?: Iterable<string> | (() => Iterable<string>);
};

/**
 * Return type of useVisitedState hook
 */
export type UseVisitedStateResult = {
  /** Current visited IDs as Set */
  visited: Set<string>;
  /** Check if an item is visited */
  isVisited: (id: string) => boolean;
  /** Toggle an item's visited status */
  toggleVisited: (id: string) => void;
  /** Add an item to visited */
  addVisited: (id: string) => void;
  /** Remove an item from visited */
  removeVisited: (id: string) => void;
};

/**
 * Hook for managing visited state using Set<string>
 *
 * @example
 * // Basic usage
 * const { visited, isVisited, toggleVisited, addVisited, removeVisited } = useVisitedState();
 *
 * @example
 * // With initial values
 * const { visited, isVisited } = useVisitedState({
 *   initialVisited: ['shop-1', 'shop-2'],
 * });
 */
export function useVisitedState(options: UseVisitedStateOptions = {}): UseVisitedStateResult {
  const { initialVisited } = options;

  const { state: visited, add, remove, toggle, has } = useSetState<string>(initialVisited);

  const isVisited = useCallback((id: string) => has(id), [has]);

  const toggleVisited = useCallback((id: string) => toggle(id), [toggle]);

  const addVisited = useCallback((id: string) => add(id), [add]);

  const removeVisited = useCallback((id: string) => remove(id), [remove]);

  return useMemo(
    () => ({
      visited,
      isVisited,
      toggleVisited,
      addVisited,
      removeVisited,
    }),
    [visited, isVisited, toggleVisited, addVisited, removeVisited],
  );
}
