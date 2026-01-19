import { useCallback, useState } from 'react';

export function useSetState<T>(initialValue?: Iterable<T> | (() => Iterable<T>)) {
  const [state, setState] = useState<Set<T>>(() => {
    if (typeof initialValue === 'function') {
      return new Set(initialValue());
    }
    return new Set(initialValue);
  });

  const add = useCallback((item: T) => {
    setState(prev => new Set(prev).add(item));
  }, []);

  const remove = useCallback((item: T) => {
    setState(prev => {
      const next = new Set(prev);
      next.delete(item);
      return next;
    });
  }, []);

  const toggle = useCallback((item: T) => {
    setState(prev => {
      const next = new Set(prev);
      if (next.has(item)) {
        next.delete(item);
      } else {
        next.add(item);
      }
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setState(new Set());
  }, []);

  const has = useCallback((item: T) => state.has(item), [state]);

  const reset = useCallback((newValue?: Iterable<T>) => {
    setState(new Set(newValue));
  }, []);

  return {
    state,
    add,
    remove,
    toggle,
    has,
    clear,
    reset,
    size: state.size,
  };
}
