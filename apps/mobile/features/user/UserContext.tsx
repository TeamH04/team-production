import { createSafeContext } from '@team/core-utils';
import { useUserState } from '@team/hooks';

import type { UserState } from '@team/hooks';
import type { ReactNode } from 'react';

const [UserContextProvider, useUser] = createSafeContext<UserState>('User');

export function UserProvider({ children }: { children: ReactNode }) {
  const userState = useUserState();

  return <UserContextProvider value={userState}>{children}</UserContextProvider>;
}

export { useUser };
