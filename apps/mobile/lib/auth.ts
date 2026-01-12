import type { User } from '@supabase/supabase-js';

import { fetchAuthMe } from './api';
import { getSupabase } from './supabase';

export type OwnerCheck = {
  isOwner: boolean;
  user: User | null;
};

function getString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function getStringArray(value: unknown): string[] | undefined {
  return Array.isArray(value) && value.every(v => typeof v === 'string')
    ? (value as string[])
    : undefined;
}

export function isOwnerFromUser(user: User | null): boolean {
  if (!user) return false;
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const app = (user.app_metadata ?? {}) as Record<string, unknown>;

  const metaRole = getString(meta['role']);
  if (metaRole === 'owner') return true;

  const appRoles = getStringArray(app['roles']);
  if (appRoles?.includes('owner')) return true;

  const appRole = getString(app['role']);
  if (appRole === 'owner') return true;

  return false;
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data, error } = await getSupabase().auth.getUser();
    if (error) {
      return null;
    }
    return data.user ?? null;
  } catch (err) {
    console.warn('[auth] failed to fetch current user', err);
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
  } catch (err) {
    console.warn('[auth] failed to fetch session', err);
    return null;
  }
}

export async function checkIsOwner(): Promise<OwnerCheck> {
  const user = await getCurrentUser();
  return { isOwner: isOwnerFromUser(user), user };
}

export async function ensureUserExistsInDB(): Promise<void> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('session_not_found');
  }
  try {
    await fetchAuthMe(token);
  } catch (err) {
    await getSupabase().auth.signOut();
    throw err;
  }
}
