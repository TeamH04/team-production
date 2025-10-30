import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type FavoritesState = Set<string>;

type FavoritesContextValue = {
  favorites: FavoritesState;
  isFavorite: (shopId: string) => boolean;
  toggleFavorite: (shopId: string) => void;
  addFavorite: (shopId: string) => void;
  removeFavorite: (shopId: string) => void;
};

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<FavoritesState>(() => new Set());

  const addFavorite = useCallback((shopId: string) => {
    setFavorites(prev => new Set(prev).add(shopId));
  }, []);

  const removeFavorite = useCallback((shopId: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      next.delete(shopId);
      return next;
    });
  }, []);

  const toggleFavorite = useCallback((shopId: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(shopId)) next.delete(shopId);
      else next.add(shopId);
      return next;
    });
  }, []);

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favorites,
      isFavorite: (id: string) => favorites.has(id),
      toggleFavorite,
      addFavorite,
      removeFavorite,
    }),
    [favorites, addFavorite, removeFavorite, toggleFavorite]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}
