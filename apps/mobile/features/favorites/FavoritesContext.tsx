import type React from 'react';
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

// ---------------------------------------------
// 型定義
// ---------------------------------------------

// お気に入り一覧を「文字列の Set 型」で管理する
type FavoritesState = Set<string>;

// コンテキストで外部に渡す機能の一覧
type FavoritesContextValue = {
  favorites: FavoritesState; // 現在のお気に入り一覧
  isFavorite: (shopId: string) => boolean; // お気に入りかどうか判定
  toggleFavorite: (shopId: string) => void; // お気に入りの追加/解除
  addFavorite: (shopId: string) => void; // お気に入りに追加
  removeFavorite: (shopId: string) => void; // お気に入りから削除
};

// Context 本体。初期値は undefined（Provider 内で必ず設定される）
const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

// ---------------------------------------------
// Provider コンポーネント
// ---------------------------------------------
export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  // お気に入りの状態を保持（Set を使用）
  const [favorites, setFavorites] = useState<FavoritesState>(() => new Set());

  // --- お気に入りに追加する処理 ---
  const addFavorite = useCallback((shopId: string) => {
    // Set は直接変更すると React が変化を検知しにくいので、
    // 新しい Set を作成して返す
    setFavorites(prev => new Set(prev).add(shopId));
  }, []);

  // --- お気に入りから削除する処理 ---
  const removeFavorite = useCallback((shopId: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      next.delete(shopId); // 指定 ID を削除
      return next;
    });
  }, []);

  // --- お気に入りを追加/削除を切り替える処理 ---
  const toggleFavorite = useCallback((shopId: string) => {
    setFavorites(prev => {
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
  const value = useMemo<FavoritesContextValue>(
    () => ({
      favorites,
      isFavorite: (id: string) => favorites.has(id),
      toggleFavorite,
      addFavorite,
      removeFavorite,
    }),
    [favorites, addFavorite, removeFavorite, toggleFavorite]
  );

  // Provider でラップして子コンポーネントが利用できるようにする
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

// ---------------------------------------------
// Context を使うための専用フック
// ---------------------------------------------
export function useFavorites() {
  const ctx = useContext(FavoritesContext);

  // Provider の外で使われた場合はエラーにする
  if (!ctx) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }

  return ctx;
}
