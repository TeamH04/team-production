import { useCallback, useEffect, useMemo, useRef } from 'react';

import { createOptimisticToggle, useOptimisticMutation } from './useOptimisticUpdate';
import { useSafeState } from './useSafeState';

import type { AuthResult } from './useOptimisticUpdate';

/**
 * お気に入り一覧を「文字列の Set 型」で管理する
 */
export type FavoritesState = Set<string>;

/**
 * useFavoritesState の API 依存関係
 */
export type FavoritesApiDependencies<TToken = string> = {
  /** お気に入り一覧を取得する API */
  fetchFavorites: (token: TToken) => Promise<Array<{ store_id: string }>>;
  /** お気に入りを追加する API */
  addFavorite: (shopId: string, token: TToken) => Promise<unknown>;
  /** お気に入りを削除する API */
  removeFavorite: (shopId: string, token: TToken) => Promise<unknown>;
};

/**
 * useFavoritesState の設定オプション
 */
export type UseFavoritesStateOptions<TToken = string> = {
  /** 認証を解決し、認証トークンを返す関数。skipped: true の場合はローカル状態のみ更新 */
  resolveAuth: () => Promise<AuthResult<TToken>>;
  /** 認証状態（楽観的更新用） */
  resolveAuthForMutation: () => Promise<AuthResult<TToken>>;
  /** API 依存関係 */
  api: FavoritesApiDependencies<TToken>;
};

/**
 * useFavoritesState の戻り値
 */
export type UseFavoritesStateResult = {
  /** 現在のお気に入り一覧 */
  favorites: FavoritesState;
  /** お気に入りかどうか判定 */
  isFavorite: (shopId: string) => boolean;
  /** 操作中かどうか判定 */
  isOperationPending: (shopId: string) => boolean;
  /** お気に入りの追加/解除 */
  toggleFavorite: (shopId: string) => Promise<void>;
  /** お気に入りに追加 */
  addFavorite: (shopId: string) => Promise<void>;
  /** お気に入りから削除 */
  removeFavorite: (shopId: string) => Promise<void>;
  /** お気に入り一覧取得 */
  loadFavorites: () => Promise<void>;
};

/**
 * お気に入り状態管理フック（API連携・楽観的更新対応）
 *
 * このフックは以下の機能を提供します：
 * - お気に入り一覧の状態管理
 * - 楽観的更新によるお気に入りの追加/削除
 * - 認証対応（ローカルモード・リモートモード）
 * - レースコンディション対策
 * - 操作中状態の追跡（isOperationPending）
 *
 * ## useFavoriteToggle との違い
 * | 機能 | useFavoriteToggle | useFavoritesState |
 * |------|-------------------|-------------------|
 * | API連携 | なし | あり |
 * | 楽観的更新 | なし | あり |
 * | 認証対応 | なし | あり |
 * | レースコンディション対策 | なし | あり |
 * | 操作中状態の追跡 | なし | あり |
 *
 * ## 使い分けの指針
 * - **useFavoriteToggle**: ローカル状態のみで十分な場合（例: localStorage との連携）
 * - **useFavoritesState**: バックエンドAPIとの同期が必要な場合
 *
 * @example
 * ```tsx
 * const {
 *   favorites,
 *   isFavorite,
 *   isOperationPending,
 *   toggleFavorite,
 *   addFavorite,
 *   removeFavorite,
 *   loadFavorites,
 * } = useFavoritesState({
 *   resolveAuth: async () => {
 *     const result = await ensureAuthenticated(authResolver);
 *     if (result.skipped) return { skipped: true };
 *     return { skipped: false, token: result.token };
 *   },
 *   resolveAuthForMutation: async () => {
 *     const result = await ensureAuthenticated(authResolver);
 *     if (result.skipped) return { skipped: true };
 *     return { skipped: false, token: result.token };
 *   },
 *   api: {
 *     fetchFavorites: (token) => fetchUserFavorites(token),
 *     addFavorite: (shopId, token) => addFavoriteApi(shopId, token),
 *     removeFavorite: (shopId, token) => removeFavoriteApi(shopId, token),
 *   },
 * });
 * ```
 *
 * @see useFavoriteToggle ローカル状態のみで十分な場合はこちらを使用
 */
export function useFavoritesState<TToken = string>(
  options: UseFavoritesStateOptions<TToken>,
): UseFavoritesStateResult {
  const { resolveAuth, resolveAuthForMutation, api } = options;

  // お気に入りの状態を保持（Set を使用）
  // useSafeState: アンマウント後の状態更新を自動的に防ぐ
  const [favorites, safeSetFavorites] = useSafeState<FavoritesState>(() => new Set());

  // レースコンディション対策: 最新のfavoritesを参照
  const favoritesRef = useRef(favorites);
  useEffect(() => {
    favoritesRef.current = favorites;
  }, [favorites]);

  // 楽観的更新フック（認証対応、アイテムごとのpending追跡）
  const { execute, isItemPending } = useOptimisticMutation<FavoritesState, string, TToken>({
    setState: safeSetFavorites,
    resolveAuth: resolveAuthForMutation,
  });

  const loadFavorites = useCallback(async () => {
    const authResult = await resolveAuth();
    if (authResult.skipped) return;
    const token = authResult.token;
    const data = await api.fetchFavorites(token);
    safeSetFavorites(() => new Set(data.map(item => item.store_id)));
  }, [resolveAuth, api, safeSetFavorites]);

  // --- お気に入りの追加/削除操作（楽観的更新、createOptimisticToggle で共通化） ---
  const { add: addFavorite, remove: removeFavorite } = useMemo(
    () =>
      createOptimisticToggle<FavoritesState, string, TToken>(
        { execute },
        {
          add: {
            optimisticUpdate: (prev, shopId) => new Set(prev).add(shopId),
            apiCall: (shopId, token) => api.addFavorite(shopId, token),
            rollback: (prev, shopId) => {
              const next = new Set(prev);
              next.delete(shopId);
              return next;
            },
          },
          remove: {
            optimisticUpdate: (prev, shopId) => {
              const next = new Set(prev);
              next.delete(shopId);
              return next;
            },
            apiCall: (shopId, token) => api.removeFavorite(shopId, token),
            rollback: (prev, shopId) => new Set(prev).add(shopId),
          },
        },
      ),
    [execute, api],
  );

  // --- お気に入りを追加/削除を切り替える処理 ---
  // レースコンディション対策: favoritesRefを使用して最新の状態を参照
  const toggleFavorite = useCallback(
    async (shopId: string) => {
      // Prevent duplicate operations
      if (isItemPending(shopId)) {
        return;
      }

      if (favoritesRef.current.has(shopId)) {
        await removeFavorite(shopId);
        return;
      }
      await addFavorite(shopId);
    },
    [addFavorite, removeFavorite, isItemPending],
  );

  // isFavorite をメモ化
  const isFavorite = useCallback((id: string) => favorites.has(id), [favorites]);

  // 結果をメモ化
  const result = useMemo<UseFavoritesStateResult>(
    () => ({
      favorites,
      isFavorite,
      isOperationPending: isItemPending,
      toggleFavorite,
      addFavorite,
      removeFavorite,
      loadFavorites,
    }),
    [
      favorites,
      isFavorite,
      isItemPending,
      toggleFavorite,
      addFavorite,
      removeFavorite,
      loadFavorites,
    ],
  );

  return result;
}
