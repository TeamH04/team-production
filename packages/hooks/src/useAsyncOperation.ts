import { useCallback, useState } from 'react';

interface AsyncOperationState<E = string> {
  loading: boolean;
  error: E | null;
}

interface UseAsyncOperationReturn<T, E = string> extends AsyncOperationState<E> {
  execute: (operation: () => Promise<T>) => Promise<T | undefined>;
  reset: () => void;
}

const DEFAULT_TIMEOUT = 30000; // 30秒

function createTimeoutPromise(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms);
  });
}

export function useAsyncOperation<T, E = string>(options?: {
  onError?: (error: unknown) => E;
  initialLoading?: boolean;
  timeout?: number;
}): UseAsyncOperationReturn<T, E> {
  const [state, setState] = useState<AsyncOperationState<E>>({
    loading: options?.initialLoading ?? false,
    error: null,
  });

  const onError = options?.onError;
  const timeout = options?.timeout ?? DEFAULT_TIMEOUT;

  const execute = useCallback(
    async (operation: () => Promise<T>): Promise<T | undefined> => {
      setState({ loading: true, error: null });
      try {
        const result = await Promise.race([operation(), createTimeoutPromise(timeout)]);
        setState({ loading: false, error: null });
        return result;
      } catch (err) {
        const errorMessage =
          onError?.(err) ?? ((err instanceof Error ? err.message : 'An error occurred') as E);
        setState({ loading: false, error: errorMessage });
        return undefined;
      }
    },
    [onError, timeout],
  );

  const reset = useCallback(() => {
    setState({ loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}
