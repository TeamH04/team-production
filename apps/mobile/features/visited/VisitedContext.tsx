import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react';

// ---------------------------------------------
// 型定義
// ---------------------------------------------

// 訪問済み一覧を「文字列の Set 型」で管理する
type VisitedState = Set<string>;

// コンテキストで外部に渡す機能の一覧
type VisitedContextValue = {
  visited: VisitedState; // 現在の訪問済み一覧
  isVisited: (shopId: string) => boolean; // 訪問済みかどうか判定
  toggleVisited: (shopId: string) => void; // 訪問済みの追加/解除
  addVisited: (shopId: string) => void; // 訪問済みに追加
  removeVisited: (shopId: string) => void; // 訪問済みから削除
};

// Context 本体。初期値は undefined（Provider 内で必ず設定される）
const VisitedContext = createContext<VisitedContextValue | undefined>(undefined);

// ---------------------------------------------
// Provider コンポーネント
// ---------------------------------------------
export function VisitedProvider({ children }: { children: ReactNode }) {
  // 訪問済みの状態を保持（Set を使用）
  const [visited, setVisited] = useState<VisitedState>(() => new Set());

  // --- 訪問済みに追加する処理 ---
  const addVisited = useCallback((shopId: string) => {
    // Set は直接変更すると React が変化を検知しにくいので、
    // 新しい Set を作成して返す
    setVisited(prev => new Set(prev).add(shopId));
  }, []);

  // --- 訪問済みから削除する処理 ---
  const removeVisited = useCallback((shopId: string) => {
    setVisited(prev => {
      const next = new Set(prev);
      next.delete(shopId); // 指定 ID を削除
      return next;
    });
  }, []);

  // --- 訪問済みを追加/削除を切り替える処理 ---
  const toggleVisited = useCallback((shopId: string) => {
    setVisited(prev => {
      const next = new Set(prev);
      // すでにあれば削除、なければ追加する
      if (next.has(shopId)) {
        next.delete(shopId);
      } else {
        next.add(shopId);
      }
      return next;
    });
  }, []);

  // ---------------------------------------------
  // Context に渡す値をメモ化して無駄な再レンダリングを防ぐ
  // ---------------------------------------------
  const value = useMemo<VisitedContextValue>(
    () => ({
      visited,
      isVisited: (shopId: string) => visited.has(shopId),
      toggleVisited,
      addVisited,
      removeVisited,
    }),
    [visited, addVisited, removeVisited, toggleVisited]
  );

  // Provider でラップして子コンポーネントが利用できるようにする
  return <VisitedContext.Provider value={value}>{children}</VisitedContext.Provider>;
}

// ---------------------------------------------
// Context を使うための専用フック
// ---------------------------------------------
export function useVisited() {
  const ctx = useContext(VisitedContext);

  // Provider の外で使われた場合はエラーにする
  if (!ctx) {
    throw new Error('useVisited must be used within VisitedProvider');
  }

  return ctx;
}
