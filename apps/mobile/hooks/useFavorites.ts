import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

const FAVORITES_KEY = 'favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ローカルストレージからお気に入りを読み込む
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const stored = await AsyncStorage.getItem(FAVORITES_KEY);
        if (stored) {
          setFavorites(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Failed to load favorites:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFavorites();
  }, []);

  // お気に入りを追加または削除
  const toggleFavorite = async (shopId: string) => {
    try {
      const updated = favorites.includes(shopId)
        ? favorites.filter(id => id !== shopId)
        : [...favorites, shopId];

      setFavorites(updated);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  // お気に入りかどうかを判定
  const isFavorite = (shopId: string) => favorites.includes(shopId);

  return { favorites, toggleFavorite, isFavorite, isLoading };
}
