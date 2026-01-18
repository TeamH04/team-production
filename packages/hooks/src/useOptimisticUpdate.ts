import { useCallback, useRef, useState } from 'react';

/**
 * A hook that encapsulates the optimistic update pattern:
 * 1. Optimistically update state
 * 2. Call API
 * 3. Rollback on error
 *
 * The `optimisticUpdate` function should:
 * - Apply the optimistic state change
 * - Return the previous state value needed for rollback
 *
 * The `onError` callback receives:
 * - The error that occurred
 * - The previous state value returned by `optimisticUpdate`, which can be used to restore state
 *
 * @template T - The type of the previous state returned by optimisticUpdate for rollback
 *
 * @example
 * ```tsx
 * const [favorites, setFavorites] = useState<Set<string>>(new Set());
 * const { execute, isPending } = useOptimisticUpdate<Set<string>>();
 *
 * const addFavorite = async (shopId: string) => {
 *   await execute(
 *     // Optimistic update: apply change and return previous state
 *     () => {
 *       const prev = new Set(favorites);
 *       setFavorites(new Set(favorites).add(shopId));
 *       return prev;
 *     },
 *     // API call
 *     () => api.addFavorite(shopId),
 *     // Error handler: receives previous state for rollback
 *     (error, previousState) => {
 *       setFavorites(previousState);
 *       throw error; // Re-throw if needed
 *     }
 *   );
 * };
 * ```
 */
export function useOptimisticUpdate<T>(): {
  execute: <R>(
    optimisticUpdate: () => T,
    apiCall: () => Promise<R>,
    onError?: (error: Error, previousState: T) => void,
  ) => Promise<R | undefined>;
  isPending: boolean;
} {
  const [isPending, setIsPending] = useState(false);
  const previousStateRef = useRef<T | undefined>(undefined);

  const execute = useCallback(
    async <R>(
      optimisticUpdate: () => T,
      apiCall: () => Promise<R>,
      onError?: (error: Error, previousState: T) => void,
    ): Promise<R | undefined> => {
      // Apply optimistic update and store the previous state for potential rollback
      const previousState = optimisticUpdate();
      previousStateRef.current = previousState;
      setIsPending(true);

      try {
        const result = await apiCall();
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));

        if (onError) {
          onError(err, previousState);
        } else {
          // Default behavior: rethrow the error
          throw err;
        }

        return undefined;
      } finally {
        setIsPending(false);
        previousStateRef.current = undefined;
      }
    },
    [],
  );

  return { execute, isPending };
}

/**
 * Options for configuring the optimistic update behavior.
 */
export type OptimisticUpdateOptions<TState, TKey, TToken = undefined> = {
  /**
   * Function to apply the optimistic update to the state.
   * @param prev - The previous state
   * @returns The new state after the optimistic update
   */
  optimisticUpdate: (prev: TState) => TState;

  /**
   * Function to call the API.
   * Receives the token if authentication is configured, otherwise undefined.
   * @param token - The authentication token (undefined if no auth configured)
   * @returns A promise that resolves when the API call completes
   */
  apiCall: (token: TToken) => Promise<unknown>;

  /**
   * Function to rollback the state on error.
   * @param prev - The current state
   * @returns The state after rollback
   */
  rollback: (prev: TState) => TState;

  /**
   * Optional key to track pending state for individual items.
   * If provided, allows checking if a specific item is pending.
   */
  key?: TKey;
};

/**
 * Result of authentication resolution.
 */
export type AuthResult<TToken> =
  | { skipped: true; token?: undefined }
  | { skipped: false; token: TToken };

/**
 * Configuration for useOptimisticMutation hook.
 */
export type OptimisticMutationConfig<TState, TToken = undefined> = {
  /**
   * State setter function.
   */
  setState: (fn: (prev: TState) => TState) => void;

  /**
   * Optional authentication resolver.
   * If provided, authentication will be checked before API calls.
   * When auth is skipped, only the optimistic update is applied without API call.
   * When not provided, apiCall receives undefined as token.
   */
  resolveAuth?: () => Promise<AuthResult<TToken>>;
};

/**
 * A hook that provides optimistic update functionality with per-item pending state tracking.
 * This is useful for scenarios where you want to prevent duplicate operations on the same item
 * and track the pending state of individual items.
 *
 * Supports optional authentication integration:
 * - When `resolveAuth` is provided, it will be called before each operation
 * - If auth is skipped (e.g., local mode), only the optimistic update is applied
 * - If auth is required, the API call receives the token
 *
 * @template TState - The type of the state being updated
 * @template TKey - The type of the key used to track pending items (default: string)
 * @template TToken - The type of the authentication token (default: string)
 *
 * @example
 * ```tsx
 * // Basic usage without authentication
 * const [favorites, setFavorites] = useState<Set<string>>(new Set());
 * const { execute, isItemPending } = useOptimisticMutation<Set<string>, string>({
 *   setState: setFavorites,
 * });
 *
 * const addFavorite = async (shopId: string) => {
 *   await execute({
 *     key: shopId,
 *     optimisticUpdate: prev => new Set(prev).add(shopId),
 *     apiCall: () => api.addFavorite(shopId),
 *     rollback: prev => {
 *       const next = new Set(prev);
 *       next.delete(shopId);
 *       return next;
 *     },
 *   });
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Usage with authentication
 * const { execute, isItemPending } = useOptimisticMutation<Set<string>, string, string>({
 *   setState: setFavorites,
 *   resolveAuth: async () => {
 *     const token = await getToken();
 *     if (!token) return { skipped: true };
 *     return { skipped: false, token };
 *   },
 * });
 *
 * const addFavorite = async (shopId: string) => {
 *   await execute({
 *     key: shopId,
 *     optimisticUpdate: prev => new Set(prev).add(shopId),
 *     apiCall: token => api.addFavorite(shopId, token),
 *     rollback: prev => {
 *       const next = new Set(prev);
 *       next.delete(shopId);
 *       return next;
 *     },
 *   });
 * };
 * ```
 */
export function useOptimisticMutation<TState, TKey = string, TToken = undefined>(
  config: OptimisticMutationConfig<TState, TToken>,
): {
  execute: (options: OptimisticUpdateOptions<TState, TKey, TToken>) => Promise<void>;
  isItemPending: (key: TKey) => boolean;
  pendingItems: Set<TKey>;
} {
  const { setState, resolveAuth } = config;
  const [pendingItems, setPendingItems] = useState<Set<TKey>>(() => new Set());

  const isItemPending = useCallback((key: TKey) => pendingItems.has(key), [pendingItems]);

  const execute = useCallback(
    async (options: OptimisticUpdateOptions<TState, TKey, TToken>): Promise<void> => {
      const { key, optimisticUpdate, apiCall, rollback } = options;

      // Check for duplicate operation if key is provided
      if (key !== undefined && pendingItems.has(key)) {
        return;
      }

      // Check authentication if resolver is provided
      if (resolveAuth) {
        const authResult = await resolveAuth();
        if (authResult.skipped) {
          // Auth skipped (e.g., local mode): only apply optimistic update
          setState(optimisticUpdate);
          return;
        }

        // Auth required: execute with token
        await executeWithPendingState(authResult.token);
        return;
      }

      // No auth resolver: execute with undefined as token
      await executeWithPendingState(undefined as TToken);

      /**
       * Helper function to execute API call with pending state management.
       * Handles optimistic update, pending state tracking, API call, and rollback on error.
       */
      async function executeWithPendingState(token: TToken): Promise<void> {
        // Apply optimistic update and track pending state
        setState(optimisticUpdate);
        if (key !== undefined) {
          setPendingItems(prev => new Set(prev).add(key));
        }

        try {
          await apiCall(token);
        } catch (error) {
          // Rollback on error
          setState(rollback);
          throw error;
        } finally {
          // Clear pending state
          if (key !== undefined) {
            setPendingItems(prev => {
              const next = new Set(prev);
              next.delete(key);
              return next;
            });
          }
        }
      }
    },
    [pendingItems, setState, resolveAuth],
  );

  return { execute, isItemPending, pendingItems };
}

/**
 * Configuration for creating optimistic toggle operations.
 * This provides a factory function pattern for creating add/remove operations
 * that share the same optimistic update logic.
 */
export type CreateOptimisticToggleConfig<TState, TKey, TToken = undefined> = {
  /**
   * The execute function from useOptimisticMutation hook.
   */
  execute: (options: OptimisticUpdateOptions<TState, TKey, TToken>) => Promise<void>;
};

/**
 * Options for defining a toggle operation (add or remove).
 */
export type OptimisticToggleOperationOptions<TState, TKey, TToken = undefined> = {
  /**
   * Function to apply the optimistic state change.
   * @param prev - The previous state
   * @param key - The item key being toggled
   * @returns The new state after the optimistic update
   */
  optimisticUpdate: (prev: TState, key: TKey) => TState;

  /**
   * Function to call the API.
   * @param key - The item key being toggled
   * @param token - The authentication token
   * @returns A promise that resolves when the API call completes
   */
  apiCall: (key: TKey, token: TToken) => Promise<unknown>;

  /**
   * Function to rollback the state on error.
   * @param prev - The current state
   * @param key - The item key being toggled
   * @returns The state after rollback
   */
  rollback: (prev: TState, key: TKey) => TState;
};

/**
 * Result of createOptimisticToggle containing add and remove operations.
 */
export type OptimisticToggleOperations<TKey> = {
  /**
   * Add operation that applies optimistic update, calls API, and handles rollback.
   * @param key - The item key to add
   * @returns Promise that resolves when the operation completes
   */
  add: (key: TKey) => Promise<void>;

  /**
   * Remove operation that applies optimistic update, calls API, and handles rollback.
   * @param key - The item key to remove
   * @returns Promise that resolves when the operation completes
   */
  remove: (key: TKey) => Promise<void>;
};

/**
 * Creates optimistic toggle operations (add/remove) with shared logic.
 *
 * This higher-order function reduces duplication when implementing
 * add/remove operations that follow the same optimistic update pattern:
 * 1. Apply optimistic state change
 * 2. Call API
 * 3. Rollback on error
 *
 * @template TState - The type of the state being updated
 * @template TKey - The type of the key identifying items (default: string)
 * @template TToken - The type of the authentication token (default: undefined)
 *
 * @example
 * ```tsx
 * const { execute } = useOptimisticMutation<Set<string>, string, string>({
 *   setState: setFavorites,
 *   resolveAuth: resolveAuthForMutation,
 * });
 *
 * const { add: addFavorite, remove: removeFavorite } = createOptimisticToggle(
 *   { execute },
 *   {
 *     add: {
 *       optimisticUpdate: (prev, shopId) => new Set(prev).add(shopId),
 *       apiCall: (shopId, token) => api.addFavorite(shopId, token),
 *       rollback: (prev, shopId) => {
 *         const next = new Set(prev);
 *         next.delete(shopId);
 *         return next;
 *       },
 *     },
 *     remove: {
 *       optimisticUpdate: (prev, shopId) => {
 *         const next = new Set(prev);
 *         next.delete(shopId);
 *         return next;
 *       },
 *       apiCall: (shopId, token) => api.removeFavorite(shopId, token),
 *       rollback: (prev, shopId) => new Set(prev).add(shopId),
 *     },
 *   },
 * );
 * ```
 */
export function createOptimisticToggle<TState, TKey = string, TToken = undefined>(
  config: CreateOptimisticToggleConfig<TState, TKey, TToken>,
  operations: {
    add: OptimisticToggleOperationOptions<TState, TKey, TToken>;
    remove: OptimisticToggleOperationOptions<TState, TKey, TToken>;
  },
): OptimisticToggleOperations<TKey> {
  const { execute } = config;

  const createOperation = (
    op: OptimisticToggleOperationOptions<TState, TKey, TToken>,
  ): ((key: TKey) => Promise<void>) => {
    return (key: TKey) =>
      execute({
        key,
        optimisticUpdate: prev => op.optimisticUpdate(prev, key),
        apiCall: token => op.apiCall(key, token),
        rollback: prev => op.rollback(prev, key),
      });
  };

  return {
    add: createOperation(operations.add),
    remove: createOperation(operations.remove),
  };
}
