import { createSafeContext } from '@team/core-utils';

import type { ReactNode } from 'react';

// TODO: Define concrete properties for MyPageContextType when MyPage-specific state is introduced.
export type MyPageContextType = object;

const [MyPageContextProvider, useMyPage] = createSafeContext<MyPageContextType>('MyPage');

/**
 * Provides MyPage context for child components
 * @param children - React child components
 */
export function MyPageProvider({ children }: { children: ReactNode }) {
  return <MyPageContextProvider value={{}}>{children}</MyPageContextProvider>;
}

export { useMyPage };
