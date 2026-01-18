import { useCallback, useEffect, useRef, useState } from 'react';

export function useSafeState<T>(initialValue: T | (() => T)) {
  const [state, setState] = useState(initialValue);
  const isMountedRef = useMounted();

  const safeSetState = useCallback(
    (value: T | ((prev: T) => T)) => {
      if (isMountedRef.current) {
        setState(value);
      }
    },
    [isMountedRef],
  );

  return [state, safeSetState] as const;
}

export function useMounted() {
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return isMountedRef;
}
