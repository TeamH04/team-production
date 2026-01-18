import {
  type AuthState,
  createDependencyInjector,
  createSafeContext,
  ensureAuthenticated,
  resolveAuthForOptimisticUpdate,
} from '@team/core-utils';
import { type FavoritesState, useFavoritesState } from '@team/hooks';
import { useEffect, useMemo } from 'react';

import { api } from '@/lib/api';
import { getSupabase, isSupabaseConfigured, resolveAuth } from '@/lib/auth';

import type { ReactNode } from 'react';

// ---------------------------------------------
// 型定義
// ---------------------------------------------

// コンテキストで外部に渡す機能の一覧
type FavoritesContextValue = {
  favorites: FavoritesState; // 現在のお気に入り一覧
  isFavorite: (shopId: string) => boolean; // お気に入りかどうか判定
  isOperationPending: (shopId: string) => boolean; // 操作中かどうか判定
  toggleFavorite: (shopId: string) => Promise<void>; // お気に入りの追加/解除
  addFavorite: (shopId: string) => Promise<void>; // お気に入りに追加
  removeFavorite: (shopId: string) => Promise<void>; // お気に入りから削除
  loadFavorites: () => Promise<void>; // お気に入り一覧取得
};

type FavoritesDependencies = {
  resolveAuth: () => Promise<AuthState>;
  fetchUserFavorites: typeof api.fetchUserFavorites;
  addFavoriteApi: typeof api.addFavorite;
  removeFavoriteApi: typeof api.removeFavorite;
  isSupabaseConfigured: typeof isSupabaseConfigured;
  getSupabase: typeof getSupabase;
};

const dependencyInjector = createDependencyInjector<FavoritesDependencies>({
  resolveAuth,
  fetchUserFavorites: api.fetchUserFavorites,
  addFavoriteApi: api.addFavorite,
  removeFavoriteApi: api.removeFavorite,
  isSupabaseConfigured,
  getSupabase,
});

export const __setFavoritesDependenciesForTesting = dependencyInjector.setForTesting;
export const __resetFavoritesDependenciesForTesting = dependencyInjector.reset;

// Context 本体
const [FavoritesContextProvider, useFavorites] =
  createSafeContext<FavoritesContextValue>('Favorites');
export { useFavorites };

// ---------------------------------------------
// Provider コンポーネント
// ---------------------------------------------
export function FavoritesProvider({ children }: { children: ReactNode }) {
  // useFavoritesState フックを使用して状態管理ロジックを抽出
  const {
    favorites,
    isFavorite,
    isOperationPending,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    loadFavorites,
  } = useFavoritesState({
    resolveAuth: async () => {
      const result = await ensureAuthenticated(dependencyInjector.get().resolveAuth);
      if (result.skipped) {
        return { skipped: true };
      }
      return { skipped: false, token: result.token! };
    },
    resolveAuthForMutation: () =>
      resolveAuthForOptimisticUpdate(dependencyInjector.get().resolveAuth),
    api: {
      fetchFavorites: token => dependencyInjector.get().fetchUserFavorites(token),
      addFavorite: (shopId, token) => dependencyInjector.get().addFavoriteApi(shopId, token),
      removeFavorite: (shopId, token) => dependencyInjector.get().removeFavoriteApi(shopId, token),
    },
  });

  // 認証状態の変更を監視してお気に入りを再読み込み
  useEffect(() => {
    if (!dependencyInjector.get().isSupabaseConfigured()) {
      return;
    }

    const { data } = dependencyInjector
      .get()
      .getSupabase()
      .auth.onAuthStateChange(() => {
        void loadFavorites().catch(() => undefined);
      });
    return () => {
      data.subscription.unsubscribe();
    };
  }, [loadFavorites]);

  // ---------------------------------------------
  // Context に渡す値をメモ化して無駄な再レンダリングを防ぐ
  // ---------------------------------------------
  const value = useMemo<FavoritesContextValue>(
    () => ({
      favorites,
      isFavorite,
      isOperationPending,
      toggleFavorite,
      addFavorite,
      removeFavorite,
      loadFavorites,
    }),
    [
      favorites,
      isFavorite,
      isOperationPending,
      addFavorite,
      removeFavorite,
      toggleFavorite,
      loadFavorites,
    ],
  );

  // Provider でラップして子コンポーネントが利用できるようにする
  return <FavoritesContextProvider value={value}>{children}</FavoritesContextProvider>;
}
