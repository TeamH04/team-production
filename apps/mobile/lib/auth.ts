import { SESSION_NOT_FOUND } from '@team/constants';
import {
  type AuthState,
  type OwnerCheck,
  hasOwnerRole as hasOwnerRoleBase,
} from '@team/core-utils';

import { api } from './api';
import { getSupabase, isSupabaseConfigured } from './supabase';

import type { User } from '@supabase/supabase-js';

// Re-export OwnerCheck with Supabase User type for mobile convenience
export type { OwnerCheck };

// Re-export from shared package with Supabase User type compatibility
export function hasOwnerRole(user: User | null): boolean {
  return hasOwnerRoleBase(user);
}

export async function getCurrentUser(): Promise<User | null> {
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

export async function getAccessToken(): Promise<string | null> {
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

export async function checkIsOwner(): Promise<OwnerCheck> {
  const user = await getCurrentUser();
  return { isOwner: hasOwnerRole(user), user };
}

export async function ensureUserExistsInDB(): Promise<void> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error(SESSION_NOT_FOUND);
  }
  try {
    await api.fetchAuthMe(token);
  } catch (err) {
    await getSupabase().auth.signOut();
    throw err;
  }
}

/**
 * 認証状態を判定し、各モードの意味を返す。
 * - local: Supabase 未設定のため、ローカル状態のみを使用する。
 * - unauthenticated: Supabase は設定済みだが、未ログインまたはトークンが取得できない。
 * - remote: 認証済みで、API 呼び出しに利用できるアクセストークンを保持している。
 */
export async function resolveAuth(): Promise<AuthState> {
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
