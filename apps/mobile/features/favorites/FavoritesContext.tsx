import type React from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  addFavorite as addFavoriteApi,
  fetchUserFavorites,
  removeFavorite as removeFavoriteApi,
} from '@/lib/api';
import { getAccessToken, getCurrentUser } from '@/lib/auth';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

// ---------------------------------------------
// 型定義
// ---------------------------------------------

// お気に入り一覧を「文字列の Set 型」で管理する
type FavoritesState = Set<string>;

// コンテキストで外部に渡す機能の一覧
type FavoritesContextValue = {
  favorites: FavoritesState; // 現在のお気に入り一覧
  isFavorite: (shopId: string) => boolean; // お気に入りかどうか判定
  toggleFavorite: (shopId: string) => Promise<void>; // お気に入りの追加/解除
  addFavorite: (shopId: string) => Promise<void>; // お気に入りに追加
  removeFavorite: (shopId: string) => Promise<void>; // お気に入りから削除
  loadFavorites: () => Promise<void>; // お気に入り一覧取得
};

const AUTH_REQUIRED = 'auth_required';

type AuthState =
  | { mode: 'local' }
  | { mode: 'unauthenticated' }
  | { mode: 'remote'; token: string };

async function resolveAuth(): Promise<AuthState> {
  if (!isSupabaseConfigured()) {
    return { mode: 'local' };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { mode: 'unauthenticated' };
  }

  const token = await getAccessToken();
  if (!token) {
    return { mode: 'unauthenticated' };
  }

  return { mode: 'remote', token };
}

type FavoritesDependencies = {
  resolveAuth: () => Promise<AuthState>;
  fetchUserFavorites: typeof fetchUserFavorites;
  addFavoriteApi: typeof addFavoriteApi;
  removeFavoriteApi: typeof removeFavoriteApi;
  isSupabaseConfigured: typeof isSupabaseConfigured;
  getSupabase: typeof getSupabase;
};

const defaultDependencies: FavoritesDependencies = {
  resolveAuth,
  fetchUserFavorites,
  addFavoriteApi,
  removeFavoriteApi,
  isSupabaseConfigured,
  getSupabase,
};

let dependencies = defaultDependencies;

const getDependencies = () => dependencies;

export function __setFavoritesDependenciesForTesting(overrides: Partial<FavoritesDependencies>) {
  dependencies = { ...dependencies, ...overrides };
}

export function __resetFavoritesDependenciesForTesting() {
  dependencies = defaultDependencies;
}

// Context 本体。初期値は undefined（Provider 内で必ず設定される）
const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

// ---------------------------------------------
// Provider コンポーネント
// ---------------------------------------------
export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  // お気に入りの状態を保持（Set を使用）
  const [favorites, setFavorites] = useState<FavoritesState>(() => new Set());

  const loadFavorites = useCallback(async () => {
    const auth = await getDependencies().resolveAuth();
    if (auth.mode === 'local') {
      return;
    }
    if (auth.mode === 'unauthenticated') {
      setFavorites(new Set());
      return;
    }
    const data = await getDependencies().fetchUserFavorites(auth.token);
    setFavorites(new Set(data.map(item => item.store_id)));
  }, []);

  // --- お気に入りに追加する処理 ---
  const addFavorite = useCallback(async (shopId: string) => {
    const auth = await getDependencies().resolveAuth();
    if (auth.mode === 'local') {
      setFavorites(prev => new Set(prev).add(shopId));
      return;
    }
    if (auth.mode === 'unauthenticated') {
      throw new Error(AUTH_REQUIRED);
    }
    await getDependencies().addFavoriteApi(shopId, auth.token);
    setFavorites(prev => new Set(prev).add(shopId));
  }, []);

  // --- お気に入りから削除する処理 ---
  const removeFavorite = useCallback(async (shopId: string) => {
    const auth = await getDependencies().resolveAuth();
    if (auth.mode === 'local') {
      setFavorites(prev => {
        const next = new Set(prev);
        next.delete(shopId);
        return next;
      });
      return;
    }
    if (auth.mode === 'unauthenticated') {
      throw new Error(AUTH_REQUIRED);
    }
    await getDependencies().removeFavoriteApi(shopId, auth.token);
    setFavorites(prev => {
      const next = new Set(prev);
      next.delete(shopId);
      return next;
    });
  }, []);

  // --- お気に入りを追加/削除を切り替える処理 ---
  const toggleFavorite = useCallback(
    async (shopId: string) => {
      if (favorites.has(shopId)) {
        await removeFavorite(shopId);
        return;
      }
      await addFavorite(shopId);
    },
    [favorites, addFavorite, removeFavorite]
  );

  useEffect(() => {
    if (!getDependencies().isSupabaseConfigured()) {
      return;
    }

    const { data } = getDependencies()
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
      isFavorite: (id: string) => favorites.has(id),
      toggleFavorite,
      addFavorite,
      removeFavorite,
      loadFavorites,
    }),
    [favorites, addFavorite, removeFavorite, toggleFavorite, loadFavorites]
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
