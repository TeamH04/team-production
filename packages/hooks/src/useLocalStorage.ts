import { IS_DEV } from '@team/constants';
import { useCallback, useEffect, useState } from 'react';

/**
 * localStorageと同期するstate管理フック
 *
 * @param key - localStorageのキー
 * @param initialValue - 初期値（localStorageにデータがない場合に使用）
 * @returns [value, setValue] - useState同様のタプル
 *
 * @example
 * ```tsx
 * const [favorites, setFavorites] = useLocalStorage<string[]>('favorites', []);
 *
 * // 値の更新
 * setFavorites(['item1', 'item2']);
 *
 * // 関数形式での更新
 * setFavorites(prev => [...prev, 'item3']);
 * ```
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  // 初期化関数でlocalStorageから読み込み（SSR対応）
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;

    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? (JSON.parse(item) as T) : initialValue;
    } catch (err) {
      if (IS_DEV) {
        console.warn(`[useLocalStorage] Failed to read key "${key}":`, err);
      }
      return initialValue;
    }
  });

  // 値が変更されたらlocalStorageに保存
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (err) {
      if (IS_DEV) {
        console.warn(`[useLocalStorage] Failed to save key "${key}":`, err);
      }
    }
  }, [key, storedValue]);

  // setStateと同様のインターフェースを提供
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue(prev => {
      const nextValue = value instanceof Function ? value(prev) : value;
      return nextValue;
    });
  }, []);

  return [storedValue, setValue];
}
