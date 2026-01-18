import { SESSION_NOT_FOUND } from '@team/constants';
import {
  type AuthState,
  type OwnerCheck,
  type UserWithMetadata,
  hasOwnerRole,
} from '@team/core-utils';

import type { SupabaseClient, User } from '@supabase/supabase-js';

/**
 * 認証クライアントの設定
 */
export interface AuthClientConfig {
  /**
   * Supabaseクライアントを取得する関数
   * シングルトンパターンで実装されていることを想定
   */
  getSupabase: () => SupabaseClient;

  /**
   * Supabaseが設定済みかどうかを判定する関数
   */
  isSupabaseConfigured: () => boolean;

  /**
   * DBにユーザーが存在することを確認するAPI呼び出し
   * 認証トークンを受け取り、ユーザー情報を返す
   */
  fetchAuthMe?: (token: string) => Promise<unknown>;
}

/**
 * 認証クライアントが提供する関数群
 */
export interface AuthClient {
  /**
   * 現在のユーザーを取得
   */
  getCurrentUser: () => Promise<User | null>;

  /**
   * アクセストークンを取得
   */
  getAccessToken: () => Promise<string | null>;

  /**
   * オーナーチェック
   */
  checkIsOwner: () => Promise<OwnerCheck<User>>;

  /**
   * DBにユーザーが存在することを確認
   * fetchAuthMeが設定されていない場合はスキップ
   */
  ensureUserExistsInDB: () => Promise<void>;

  /**
   * 認証状態を判定
   * - local: Supabase未設定
   * - unauthenticated: 未ログイン
   * - remote: 認証済み
   */
  resolveAuth: () => Promise<AuthState>;

  /**
   * ユーザーがオーナーロールを持っているかチェック
   */
  hasOwnerRole: (user: User | null) => boolean;

  /**
   * Supabaseが設定済みかどうか
   */
  isSupabaseConfigured: () => boolean;

  /**
   * Supabaseクライアントを取得
   */
  getSupabase: () => SupabaseClient;
}

/**
 * 認証クライアントを作成するファクトリ関数
 *
 * @example
 * // Mobile usage
 * const authClient = createAuthClient({
 *   getSupabase: () => supabaseClient,
 *   isSupabaseConfigured: () => Boolean(url && key),
 *   fetchAuthMe: (token) => api.fetchAuthMe(token),
 * });
 *
 * const user = await authClient.getCurrentUser();
 * const token = await authClient.getAccessToken();
 */
export function createAuthClient(config: AuthClientConfig): AuthClient {
  const { getSupabase, isSupabaseConfigured, fetchAuthMe } = config;

  async function getCurrentUser(): Promise<User | null> {
    try {
      const { data, error } = await getSupabase().auth.getUser();
      if (error) {
        return null;
      }
      return data.user ?? null;
    } catch {
      return null;
    }
  }

  async function getAccessToken(): Promise<string | null> {
    try {
      const { data, error } = await getSupabase().auth.getSession();
      if (error) {
        return null;
      }
      return data.session?.access_token ?? null;
    } catch {
      return null;
    }
  }

  async function checkIsOwner(): Promise<OwnerCheck<User>> {
    const user = await getCurrentUser();
    return { isOwner: hasOwnerRole(user as UserWithMetadata), user };
  }

  async function ensureUserExistsInDB(): Promise<void> {
    if (!fetchAuthMe) {
      return;
    }

    const token = await getAccessToken();
    if (!token) {
      throw new Error(SESSION_NOT_FOUND);
    }

    try {
      await fetchAuthMe(token);
    } catch (err) {
      await getSupabase().auth.signOut();
      throw err;
    }
  }

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

  function checkHasOwnerRole(user: User | null): boolean {
    return hasOwnerRole(user as UserWithMetadata);
  }

  return {
    getCurrentUser,
    getAccessToken,
    checkIsOwner,
    ensureUserExistsInDB,
    resolveAuth,
    hasOwnerRole: checkHasOwnerRole,
    isSupabaseConfigured,
    getSupabase,
  };
}
