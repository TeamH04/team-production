import { createSafeContext } from '@team/core-utils';
import { useUserState } from '@team/hooks';
import { useMemo } from 'react';

import { api } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';

import type { UserState } from '@team/hooks';
import type { Gender, UserProfile } from '@team/types';
import type { ReactNode } from 'react';

const [UserContextProvider, useUser] = createSafeContext<UserState>('User');

async function fetchUser(): Promise<UserProfile | null> {
  const token = await getAccessToken();
  if (!token) return null;

  const apiUser = await api.fetchAuthMe(token);
  if (!apiUser) return null;

  // プロフィール登録済みかどうかは、name と email が存在し、
  // gender（任意フィールド）が設定されているかで判定
  // 新規登録ユーザーは name が空または email のみの状態
  const isProfileRegistered = !!(apiUser.name && apiUser.gender);

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
