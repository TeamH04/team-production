import { createContext, useContext } from 'react';

import type { ReactNode } from 'react';

// TODO: Define concrete properties for MyPageContextType when MyPage-specific state is introduced.
export type MyPageContextType = object;

const MyPageContext = createContext<MyPageContextType | undefined>(undefined);

/**
 * Provides MyPage context for child components
 * @param children - React child components
 */
export function MyPageProvider({ children }: { children: ReactNode }) {
  return <MyPageContext.Provider value={{}}>{children}</MyPageContext.Provider>;
}

/**
 * Hook to access MyPage context
 * Intentionally providing an empty context for now; will be populated in future implementations
 * @returns MyPageContextType
 * @throws Error if used outside MyPageProvider
 */
export function useMyPage(): MyPageContextType {
  const context = useContext(MyPageContext);
  if (!context) {
    throw new Error('useMyPage must be used within MyPageProvider');
  }
  return context;
}
