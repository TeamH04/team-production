import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type Gender = 'male' | 'female' | 'other';

export type UserProfile = {
  name: string;
  email: string;
  gender?: Gender;
  birthYear?: string;
  birthMonth?: string;
  isProfileRegistered: boolean;
  favoriteGenres?: string[];
};

type UserContextType = {
  user: UserProfile | null;
  isProfileComplete: boolean;
  setUser: (u: UserProfile) => void;
  clearUser: () => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<UserProfile | null>(null);

  const setUser = useCallback((profile: UserProfile) => {
    setUserState(profile);
  }, []);

  const clearUser = useCallback(() => {
    setUserState(null);
  }, []);

  const value = useMemo<UserContextType>(
    () => ({ user, isProfileComplete: !!user && user.isProfileRegistered, setUser, clearUser }),
    [user, setUser, clearUser]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
