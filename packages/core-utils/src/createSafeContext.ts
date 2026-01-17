import { createContext, useContext } from 'react';

export function createSafeContext<T>(displayName: string) {
  const Context = createContext<T | undefined>(undefined);
  Context.displayName = displayName;

  function useSafeContext(): T {
    const ctx = useContext(Context);
    if (ctx === undefined) {
      throw new Error(`use${displayName} must be used within ${displayName}Provider`);
    }
    return ctx;
  }

  return [Context.Provider, useSafeContext, Context] as const;
}
