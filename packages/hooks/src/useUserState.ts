import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { UserProfile } from '@team/types';

export type UserStateConfig = {
  /**
   * 初回マウント時にユーザー情報を復元する関数
   * 認証済みの場合は UserProfile を返し、未認証の場合は null を返す
   */
  fetchUser?: () => Promise<UserProfile | null>;
};

export type UserState = {
  user: UserProfile | null;
  isProfileComplete: boolean;
  isRestoring: boolean;
  setUser: (u: UserProfile) => void;
  clearUser: () => void;
};

export function useUserState(config?: UserStateConfig): UserState {
  const [user, setUserState] = useState<UserProfile | null>(null);
  const [isRestoring, setIsRestoring] = useState(!!config?.fetchUser);
  const initializedRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (initializedRef.current || !config?.fetchUser) return;
    initializedRef.current = true;

    const restore = async () => {
      try {
        const restored = await config.fetchUser!();
        if (mountedRef.current && restored) {
          setUserState(restored);
        }
      } catch {
        // 復元失敗時は何もしない
      } finally {
        if (mountedRef.current) {
          setIsRestoring(false);
        }
      }
    };

    void restore();
  }, [config]);

  const setUser = useCallback((profile: UserProfile) => {
    setUserState(profile);
  }, []);

  const clearUser = useCallback(() => {
    setUserState(null);
  }, []);

  const isProfileComplete = useMemo(() => !!user && !!user.isProfileRegistered, [user]);

  return useMemo(
    () => ({ user, isProfileComplete, isRestoring, setUser, clearUser }),
    [user, isProfileComplete, isRestoring, setUser, clearUser],
  );
}
