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

  return {
    name: apiUser.name,
    email: apiUser.email,
    gender: (apiUser.gender as Gender) ?? undefined,
    isProfileRegistered: true,
  };
}

export function UserProvider({ children }: { children: ReactNode }) {
  const config = useMemo(() => ({ fetchUser }), []);
  const userState = useUserState(config);

  return <UserContextProvider value={userState}>{children}</UserContextProvider>;
}

export { useUser };
