import AsyncStorage from '@react-native-async-storage/async-storage';
import { createSafeContext, devWarn } from '@team/core-utils';
import { useUserState } from '@team/hooks';
import { useMemo } from 'react';

import { api } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';

import type { UserState } from '@team/hooks';
import type { Gender, UserProfile } from '@team/types';
import type { ReactNode } from 'react';

/** AsyncStorage キー: プロフィール登録済みフラグ */
export const PROFILE_REGISTERED_KEY = '@user/isProfileRegistered';

const [UserContextProvider, useUser] = createSafeContext<UserState>('User');

async function fetchUser(): Promise<UserProfile | null> {
  const token = await getAccessToken();
  if (!token) return null;

  let apiUser;
  try {
    apiUser = await api.fetchAuthMe(token);
  } catch (err) {
    // 認証エラーやネットワークエラー時は null を返す
    // エラーは useUserState の catch ブロックでもハンドリングされる
    devWarn('Failed to fetch user:', err);
    return null;
  }
  if (!apiUser) return null;

  // プロフィール登録済みかどうかは、name と email が存在するかで判定
  // gender は任意フィールドのため判定条件に含めない
  // 新規登録ユーザーは name が空または email のみの状態
  const isProfileRegistered = !!(apiUser.name?.trim() && apiUser.email);

  // ローカルストレージにも保存（オフライン時のフォールバック用）
  await AsyncStorage.setItem(PROFILE_REGISTERED_KEY, isProfileRegistered.toString());

  return {
    name: apiUser.name,
    email: apiUser.email,
    gender: (apiUser.gender as Gender) ?? undefined,
    isProfileRegistered,
  };
}

export function UserProvider({ children }: { children: ReactNode }) {
  const config = useMemo(() => ({ fetchUser }), []);
  const userState = useUserState(config);

  return <UserContextProvider value={userState}>{children}</UserContextProvider>;
}

export { useUser };
