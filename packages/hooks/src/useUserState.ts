import { useCallback, useMemo, useState } from 'react';

import type { UserProfile } from '@team/types';

export type UserState = {
  user: UserProfile | null;
  isProfileComplete: boolean;
  setUser: (u: UserProfile) => void;
  clearUser: () => void;
};

export function useUserState(): UserState {
  const [user, setUserState] = useState<UserProfile | null>(null);

  const setUser = useCallback((profile: UserProfile) => {
    setUserState(profile);
  }, []);

  const clearUser = useCallback(() => {
    setUserState(null);
  }, []);

  const isProfileComplete = useMemo(() => !!user && user.isProfileRegistered, [user]);

  return useMemo(
    () => ({ user, isProfileComplete, setUser, clearUser }),
    [user, isProfileComplete, setUser, clearUser],
  );
}
