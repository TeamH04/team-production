import { createContext, useContext } from 'react';

export interface MyPageContextType {
  // コンテキスト型の定義
}

const MyPageContext = createContext<MyPageContextType | undefined>(undefined);

export function MyPageProvider({ children }: { children: React.ReactNode }) {
  return <MyPageContext.Provider value={{}}>{children}</MyPageContext.Provider>;
}

export function useMyPage(): MyPageContextType {
  const context = useContext(MyPageContext);
  if (!context) {
    throw new Error('useMyPage must be used within MyPageProvider');
  }
  return context;
}
