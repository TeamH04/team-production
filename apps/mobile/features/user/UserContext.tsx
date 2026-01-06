import React, { createContext, useContext, useMemo, useState } from 'react';

type Gender = 'male' | 'female' | 'other';
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

  const setUser = (profile: UserProfile) => {
    setUserState(profile);
    // 必要なら AsyncStorage 等に永続化する処理を追加
  };

  const clearUser = () => setUserState(null);

  const value = useMemo<UserContextType>(
    () => ({ user, isProfileComplete: !!user && user.isProfileRegistered, setUser, clearUser }),
    [user]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
