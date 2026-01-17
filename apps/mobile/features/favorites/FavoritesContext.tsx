import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  addFavorite as addFavoriteApi,
  fetchUserFavorites,
  removeFavorite as removeFavoriteApi,
} from '@/lib/api';
import { getAccessToken, getCurrentUser } from '@/lib/auth';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

import type { ReactNode } from 'react';

// ---------------------------------------------
// 型定義
// ---------------------------------------------

// お気に入り一覧を「文字列の Set 型」で管理する
type FavoritesState = Set<string>;

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

const AUTH_REQUIRED = 'auth_required';

type AuthState =
  | { mode: 'local' }
  | { mode: 'unauthenticated' }
  | { mode: 'remote'; token: string };

/**
 * 認証状態を判定し、各モードの意味を返す。
 * - local: Supabase 未設定のため、ローカル状態のみを使用する。
 * - unauthenticated: Supabase は設定済みだが、未ログインまたはトークンが取得できない。
 * - remote: 認証済みで、API 呼び出しに利用できるアクセストークンを保持している。
 */
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

/**
 * @internal テスト専用 - 本番コードで使用しないこと
 * 依存関係をモックに差し替える
 */
export function __setFavoritesDependenciesForTesting(overrides: Partial<FavoritesDependencies>) {
  dependencies = { ...dependencies, ...overrides };
}

/**
 * @internal テスト専用 - 本番コードで使用しないこと
 * 依存関係をデフォルトにリセットする
 */
export function __resetFavoritesDependenciesForTesting() {
  dependencies = defaultDependencies;
}

// Context 本体。初期値は undefined（Provider 内で必ず設定される）
const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

// ---------------------------------------------
// Provider コンポーネント
// ---------------------------------------------
export function FavoritesProvider({ children }: { children: ReactNode }) {
  // お気に入りの状態を保持（Set を使用）
  const [favorites, setFavorites] = useState<FavoritesState>(() => new Set());
  // 操作中のshopIdを追跡（ダブルポスト防止）
  const [pendingOps, setPendingOps] = useState<Set<string>>(() => new Set());
  // メモリリーク対策: マウント状態を追跡
  const isMountedRef = useRef(true);
  // レースコンディション対策: 最新のfavoritesを参照
  const favoritesRef = useRef(favorites);
  favoritesRef.current = favorites;

  // 安全にsetFavoritesを呼ぶヘルパー
  const safeSetFavorites = useCallback((updater: (prev: FavoritesState) => FavoritesState) => {
    if (isMountedRef.current) {
      setFavorites(updater);
    }
  }, []);

  // 安全にsetPendingOpsを呼ぶヘルパー
  const safeSetPendingOps = useCallback((updater: (prev: Set<string>) => Set<string>) => {
    if (isMountedRef.current) {
      setPendingOps(updater);
    }
  }, []);

  // 操作中かどうかを判定
  const isOperationPending = useCallback((shopId: string) => pendingOps.has(shopId), [pendingOps]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadFavorites = useCallback(async () => {
    const auth = await getDependencies().resolveAuth();
    if (auth.mode === 'local') {
      return;
    }
    if (auth.mode === 'unauthenticated') {
      safeSetFavorites(() => new Set());
      return;
    }
    const data = await getDependencies().fetchUserFavorites(auth.token);
    safeSetFavorites(() => new Set(data.map(item => item.store_id)));
  }, [safeSetFavorites]);

  // --- お気に入りに追加する処理（楽観的更新） ---
  const addFavorite = useCallback(
    async (shopId: string) => {
      // 操作中の場合は無視（ダブルポスト防止）
      if (pendingOps.has(shopId)) {
        return;
      }

      const auth = await getDependencies().resolveAuth();
      if (auth.mode === 'local') {
        safeSetFavorites(prev => new Set(prev).add(shopId));
        return;
      }
      if (auth.mode === 'unauthenticated') {
        throw new Error(AUTH_REQUIRED);
      }

      // 楽観的更新: 先にUIを更新
      safeSetFavorites(prev => new Set(prev).add(shopId));
      safeSetPendingOps(prev => new Set(prev).add(shopId));

      try {
        await getDependencies().addFavoriteApi(shopId, auth.token);
      } catch (error) {
        // ロールバック: 失敗時は元に戻す
        safeSetFavorites(prev => {
          const next = new Set(prev);
          next.delete(shopId);
          return next;
        });
        throw error;
      } finally {
        safeSetPendingOps(prev => {
          const next = new Set(prev);
          next.delete(shopId);
          return next;
        });
      }
    },
    [pendingOps, safeSetFavorites, safeSetPendingOps],
  );

  // --- お気に入りから削除する処理（楽観的更新） ---
  const removeFavorite = useCallback(
    async (shopId: string) => {
      // 操作中の場合は無視（ダブルポスト防止）
      if (pendingOps.has(shopId)) {
        return;
      }

      const auth = await getDependencies().resolveAuth();
      if (auth.mode === 'local') {
        safeSetFavorites(prev => {
          const next = new Set(prev);
          next.delete(shopId);
          return next;
        });
        return;
      }
      if (auth.mode === 'unauthenticated') {
        throw new Error(AUTH_REQUIRED);
      }

      // 楽観的更新: 先にUIを更新
      safeSetFavorites(prev => {
        const next = new Set(prev);
        next.delete(shopId);
        return next;
      });
      safeSetPendingOps(prev => new Set(prev).add(shopId));

      try {
        await getDependencies().removeFavoriteApi(shopId, auth.token);
      } catch (error) {
        // ロールバック: 失敗時は元に戻す
        safeSetFavorites(prev => new Set(prev).add(shopId));
        throw error;
      } finally {
        safeSetPendingOps(prev => {
          const next = new Set(prev);
          next.delete(shopId);
          return next;
        });
      }
    },
    [pendingOps, safeSetFavorites, safeSetPendingOps],
  );

  // --- お気に入りを追加/削除を切り替える処理 ---
  // レースコンディション対策: favoritesRefを使用して最新の状態を参照
  const toggleFavorite = useCallback(
    async (shopId: string) => {
      if (favoritesRef.current.has(shopId)) {
        await removeFavorite(shopId);
        return;
      }
      await addFavorite(shopId);
    },
    [addFavorite, removeFavorite],
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
      isOperationPending,
      toggleFavorite,
      addFavorite,
      removeFavorite,
      loadFavorites,
    }),
    [favorites, isOperationPending, addFavorite, removeFavorite, toggleFavorite, loadFavorites],
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
