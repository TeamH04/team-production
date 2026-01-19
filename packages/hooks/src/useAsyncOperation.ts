import { useCallback, useState } from 'react';

interface AsyncOperationState<E = string> {
  loading: boolean;
  error: E | null;
}

interface UseAsyncOperationReturn<T, E = string> extends AsyncOperationState<E> {
  execute: (operation: () => Promise<T>) => Promise<T | undefined>;
  reset: () => void;
}

export function useAsyncOperation<T, E = string>(options?: {
  onError?: (error: unknown) => E;
  initialLoading?: boolean;
}): UseAsyncOperationReturn<T, E> {
  const [state, setState] = useState<AsyncOperationState<E>>({
    loading: options?.initialLoading ?? false,
    error: null,
  });

  const onError = options?.onError;
  const execute = useCallback(
    async (operation: () => Promise<T>): Promise<T | undefined> => {
      setState({ loading: true, error: null });
      try {
        const result = await operation();
        setState({ loading: false, error: null });
        return result;
      } catch (err) {
        const errorMessage =
          onError?.(err) ?? ((err instanceof Error ? err.message : 'An error occurred') as E);
        setState({ loading: false, error: errorMessage });
        return undefined;
      }
    },
    [onError],
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
