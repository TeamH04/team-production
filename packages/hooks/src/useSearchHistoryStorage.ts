import { SEARCH_HISTORY_MAX } from '@team/constants';
import { useCallback, useEffect, useRef, useState } from 'react';

// =============================================================================
// Types
// =============================================================================

/**
 * ストレージアダプターインターフェース
 * AsyncStorage、localStorage等の抽象化
 */
export type StorageAdapter = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
};

/**
 * useSearchHistoryStorage のオプション
 */
export type UseSearchHistoryStorageOptions = {
  /** ストレージアダプター（AsyncStorage, localStorage等） */
  storage: StorageAdapter;
  /** ストレージキー（デフォルト: '@team/search_history'） */
  storageKey?: string;
  /** 最大履歴件数（デフォルト: SEARCH_HISTORY_MAX） */
  maxItems?: number;
  /** 開発モードフラグ（エラーログ出力用） */
  isDev?: boolean;
};

/**
 * useSearchHistoryStorage の戻り値
 */
export type UseSearchHistoryStorageResult = {
  /** 検索履歴配列 */
  searchHistory: string[];
  /** 検索履歴に追加（重複は先頭に移動） */
  addToHistory: (text: string) => void;
  /** 検索履歴から削除 */
  removeFromHistory: (text: string) => void;
  /** 検索履歴をクリア */
  clearHistory: () => void;
  /** 読み込み中フラグ */
  isLoading: boolean;
};

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_STORAGE_KEY = '@team/search_history';

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * 検索履歴の永続化を管理するカスタムフック
 *
 * ストレージアダプターを受け取ることで、AsyncStorage（React Native）や
 * localStorage（Web）など、プラットフォームに依存しない実装が可能。
 *
 * @example
 * ```tsx
 * // React Native (AsyncStorage)
 * import AsyncStorage from '@react-native-async-storage/async-storage';
 *
 * const { searchHistory, addToHistory, removeFromHistory } = useSearchHistoryStorage({
 *   storage: AsyncStorage,
 * });
 *
 * // Web (localStorage wrapper)
 * const localStorageAdapter = {
 *   getItem: async (key) => localStorage.getItem(key),
 *   setItem: async (key, value) => localStorage.setItem(key, value),
 * };
 *
 * const { searchHistory, addToHistory } = useSearchHistoryStorage({
 *   storage: localStorageAdapter,
 * });
 * ```
 */
export function useSearchHistoryStorage({
  storage,
  storageKey = DEFAULT_STORAGE_KEY,
  maxItems = SEARCH_HISTORY_MAX,
  isDev = false,
}: UseSearchHistoryStorageOptions): UseSearchHistoryStorageResult {
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isInitialMount = useRef(true);

  // マウント時にストレージから読み込み
  useEffect(() => {
    let isMounted = true;

    const loadHistory = async () => {
      try {
        const stored = await storage.getItem(storageKey);
        if (stored && isMounted) {
          const parsed = JSON.parse(stored) as unknown;
          if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
            // ロード中に追加された履歴を保持しつつ、ストレージからの履歴とマージ
            // 現在のstateを優先（ロード中に追加された新しい履歴が先頭に来る）
            setSearchHistory(current => {
              if (current.length === 0) {
                // ロード中に追加がなければストレージの値をそのまま使用
                return parsed;
              }
              // 現在のstateにある項目を除いた、ストレージからの履歴
              const storedWithoutCurrent = parsed.filter((item: string) => !current.includes(item));
              // 現在のstate（新しい履歴）を先頭に、ストレージからの履歴を後ろにマージ
              return [...current, ...storedWithoutCurrent].slice(0, maxItems);
            });
          }
        }
      } catch (error) {
        if (isDev) {
          console.error('Failed to load search history:', error);
        }
      } finally {
        if (isMounted) {
          isInitialMount.current = false;
          setIsLoading(false);
        }
      }
    };

    void loadHistory();

    return () => {
      isMounted = false;
    };
  }, [storage, storageKey, isDev, maxItems]);

  // 履歴が変更されたらストレージに保存
  useEffect(() => {
    if (isInitialMount.current) return;

    const saveHistory = async () => {
      try {
        await storage.setItem(storageKey, JSON.stringify(searchHistory));
      } catch (error) {
        if (isDev) {
          console.error('Failed to save search history:', error);
        }
      }
    };

    void saveHistory();
  }, [searchHistory, storage, storageKey, isDev]);

  // 履歴に追加（重複は先頭に移動）
  const addToHistory = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (trimmed === '') return;

      setSearchHistory(prev => {
        const filtered = prev.filter(item => item !== trimmed);
        return [trimmed, ...filtered].slice(0, maxItems);
      });
    },
    [maxItems],
  );

  // 履歴から削除
  const removeFromHistory = useCallback((text: string) => {
    setSearchHistory(prev => prev.filter(item => item !== text));
  }, []);

  // 履歴をクリア
  const clearHistory = useCallback(() => {
    setSearchHistory([]);
  }, []);

  return {
    searchHistory,
    addToHistory,
    removeFromHistory,
    clearHistory,
    isLoading,
  };
}
