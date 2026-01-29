import {
  DEFAULT_SEARCH_SORT_ORDERS,
  SEARCH_HISTORY_MAX,
  type SearchSortOrders,
  type SearchSortType,
  type SortOrder,
} from '@team/constants';
import { getSortOrderLabel as getSortOrderLabelUtil } from '@team/shop-core';
import { useCallback, useMemo, useState } from 'react';

// =============================================================================
// Types
// =============================================================================

/**
 * 検索状態
 */
export interface SearchState {
  /** ユーザーが入力中のテキスト */
  userTypedText: string;
  /** 確定した検索テキスト */
  currentSearchText: string;
  /** 選択されたカテゴリ */
  activeCategories: string[];
  /** 選択されたタグ */
  selectedTags: string[];
  /** 検索履歴 */
  searchHistory: string[];
  /** ソート種別 */
  sortBy: SearchSortType;
  /** 各ソート種別の昇順/降順 */
  sortOrders: SearchSortOrders;
}

/**
 * 検索状態の依存関係
 */
export interface SearchStateDependencies {
  /**
   * カテゴリごとのタグを取得する関数
   * カテゴリ選択解除時に関連タグを削除するために使用
   */
  getTagsByCategory: (category: string) => string[];
}

/**
 * useSearchState の初期値オプション
 */
export interface UseSearchStateOptions {
  /** 初期検索履歴 */
  initialHistory?: string[];
  /** 初期ソート種別 */
  initialSortBy?: SearchSortType;
  /** 初期ソート順序 */
  initialSortOrders?: SearchSortOrders;
  /** 依存関係 */
  dependencies: SearchStateDependencies;
}

/**
 * useSearchState の戻り値
 */
export interface UseSearchStateResult {
  // 検索状態
  /** ユーザーが入力中のテキスト */
  userTypedText: string;
  /** 確定した検索テキスト */
  currentSearchText: string;
  /** 選択されたカテゴリ */
  activeCategories: string[];
  /** 選択されたタグ */
  selectedTags: string[];
  /** 検索履歴 */
  searchHistory: string[];
  /** 検索条件があるかどうか */
  hasSearchCriteria: boolean;

  // ソート状態
  /** 現在のソート種別 */
  sortBy: SearchSortType;
  /** 各ソート種別の昇順/降順 */
  sortOrders: SearchSortOrders;
  /** 現在のソート順序 */
  currentSortOrder: SortOrder;

  // アクション
  /** 入力テキストを更新 */
  setUserTypedText: (text: string) => void;
  /** カテゴリを選択/解除 */
  handleCategoryPress: (category: string) => void;
  /** タグを選択/解除 */
  handleTagPress: (tag: string) => void;
  /** 検索を実行（履歴に追加） */
  handleSearch: (textToSearch?: string) => void;
  /** 検索履歴から項目を削除 */
  handleRemoveHistory: (item: string) => void;
  /** ソート種別を変更 */
  handleSortTypePress: (value: SearchSortType) => void;
  /** ソート順序を切り替え */
  toggleSortOrder: () => void;
  /** ソート順序のラベルを取得 */
  getSortOrderLabel: () => string;
  /** すべてクリア */
  handleClearAll: () => void;
}

// =============================================================================
// Hook Implementation
// =============================================================================

/**
 * 検索画面の状態管理ロジックを提供するカスタムフック
 *
 * このフックはプラットフォーム非依存で、検索機能の状態管理とロジックを提供します。
 * ストレージやUI固有の機能は引数として受け取る設計になっています。
 *
 * @example
 * ```tsx
 * const {
 *   userTypedText,
 *   currentSearchText,
 *   activeCategories,
 *   selectedTags,
 *   searchHistory,
 *   sortBy,
 *   sortOrders,
 *   handleSearch,
 *   handleCategoryPress,
 *   handleTagPress,
 *   toggleSortOrder,
 *   getSortOrderLabel,
 * } = useSearchState({
 *   dependencies: {
 *     getTagsByCategory: (cat) => TAGS_BY_CATEGORY[cat] || [],
 *   },
 * });
 * ```
 */
export function useSearchState({
  initialHistory = [],
  initialSortBy = 'default',
  initialSortOrders = DEFAULT_SEARCH_SORT_ORDERS,
  dependencies,
}: UseSearchStateOptions): UseSearchStateResult {
  const { getTagsByCategory } = dependencies;

  // 検索状態
  const [userTypedText, setUserTypedText] = useState('');
  const [currentSearchText, setCurrentSearchText] = useState('');
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>(initialHistory);

  // ソート状態
  const [sortBy, setSortBy] = useState<SearchSortType>(initialSortBy);
  const [sortOrders, setSortOrders] = useState<SearchSortOrders>(initialSortOrders);

  // 派生状態
  const hasSearchCriteria = useMemo(
    () => currentSearchText.length > 0 || selectedTags.length > 0 || activeCategories.length > 0,
    [currentSearchText, selectedTags, activeCategories],
  );

  const currentSortOrder = sortOrders[sortBy];

  // カテゴリ選択/解除
  const handleCategoryPress = useCallback(
    (category: string) => {
      setActiveCategories(prev => {
        const isDeselecting = prev.includes(category);
        if (isDeselecting) {
          // カテゴリ解除時は、そのカテゴリに属するタグも解除
          const tagsToRemove = getTagsByCategory(category);
          setSelectedTags(currentTags => currentTags.filter(tag => !tagsToRemove.includes(tag)));
          return prev.filter(c => c !== category);
        } else {
          return [...prev, category];
        }
      });
    },
    [getTagsByCategory],
  );

  // タグ選択/解除
  const handleTagPress = useCallback((tag: string) => {
    setSelectedTags(prev => (prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]));
  }, []);

  // 検索実行
  const handleSearch = useCallback(
    (textToSearch?: string) => {
      const targetText = textToSearch !== undefined ? textToSearch : userTypedText;
      const trimmedText = targetText.trim();

      if (trimmedText === '') return;

      // 検索履歴を更新（重複防止、最大件数制限）
      setSearchHistory(prev => {
        const filtered = prev.filter(item => item !== trimmedText);
        return [trimmedText, ...filtered].slice(0, SEARCH_HISTORY_MAX);
      });

      setCurrentSearchText(trimmedText);
      if (textToSearch === undefined) {
        setUserTypedText('');
      }
    },
    [userTypedText],
  );

  // 検索履歴から項目を削除
  const handleRemoveHistory = useCallback((item: string) => {
    setSearchHistory(prev => prev.filter(h => h !== item));
  }, []);

  // ソート種別変更
  const handleSortTypePress = useCallback(
    (value: SearchSortType) => {
      if (sortBy !== value) setSortBy(value);
    },
    [sortBy],
  );

  // ソート順序切り替え
  const toggleSortOrder = useCallback(() => {
    setSortOrders(prev => ({
      ...prev,
      [sortBy]: prev[sortBy] === 'desc' ? 'asc' : 'desc',
    }));
  }, [sortBy]);

  // ソート順序ラベル取得（@team/shop-core の関数を使用）
  const getSortOrderLabel = useCallback(() => {
    return getSortOrderLabelUtil(sortBy, sortOrders[sortBy]);
  }, [sortBy, sortOrders]);

  // すべてクリア
  const handleClearAll = useCallback(() => {
    setUserTypedText('');
    setCurrentSearchText('');
    setActiveCategories([]);
    setSelectedTags([]);
    setSortBy('default');
  }, []);

  return useMemo(
    () => ({
      // 検索状態
      userTypedText,
      currentSearchText,
      activeCategories,
      selectedTags,
      searchHistory,
      hasSearchCriteria,

      // ソート状態
      sortBy,
      sortOrders,
      currentSortOrder,

      // アクション
      setUserTypedText,
      handleCategoryPress,
      handleTagPress,
      handleSearch,
      handleRemoveHistory,
      handleSortTypePress,
      toggleSortOrder,
      getSortOrderLabel,
      handleClearAll,
    }),
    [
      userTypedText,
      currentSearchText,
      activeCategories,
      selectedTags,
      searchHistory,
      hasSearchCriteria,
      sortBy,
      sortOrders,
      currentSortOrder,
      setUserTypedText,
      handleCategoryPress,
      handleTagPress,
      handleSearch,
      handleRemoveHistory,
      handleSortTypePress,
      toggleSortOrder,
      getSortOrderLabel,
      handleClearAll,
    ],
  );
}
