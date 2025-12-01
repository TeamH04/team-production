import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type UserProfile = {
  name: string;
  email: string;
};

type UserContextValue = {
  profile: UserProfile;
  updateProfile: (patch: Partial<UserProfile>) => void;
};

const DEFAULT_PROFILE: UserProfile = {
  name: 'Kyokk',
  email: 'user@example.com',
};

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);

  const updateProfile = useCallback((patch: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...patch }));
  }, []);

  const value = useMemo<UserContextValue>(
    () => ({ profile, updateProfile }),
    [profile, updateProfile]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
