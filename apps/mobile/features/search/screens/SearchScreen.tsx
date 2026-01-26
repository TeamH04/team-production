/* global __DEV__ */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BORDER_RADIUS,
  DEFAULT_SEARCH_SORT_ORDERS,
  ERROR_MESSAGES,
  LAYOUT,
  ROUTES,
  SEARCH_SORT_OPTIONS,
  SPACING,
  VISITED_FILTER_OPTIONS,
  type SearchSortType,
  type SortOrder,
} from '@team/constants';
import { getIdNum } from '@team/core-utils';
import { useSearchHistoryStorage, useShopFilter } from '@team/hooks';
import { palette, ToggleButton } from '@team/mobile-ui';
import {
  extractCategories,
  extractTagsByCategory,
  formatShopMeta,
  getSortOrderLabel,
  sortShops,
} from '@team/shop-core';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ShopCard } from '@/components/ShopCard';
import { fonts } from '@/constants/typography';
import { useStores } from '@/features/stores/StoresContext';
import { useVisited } from '@/features/visited/VisitedContext';

import type { Shop, VisitedFilter } from '@team/types';

export default function SearchScreen() {
  const router = useRouter();
  const { isVisited } = useVisited();
  const [userTypedText, setUserTypedText] = useState('');
  const [currentSearchText, setCurrentSearchText] = useState('');
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const { stores: shops, loading, error: loadError } = useStores();
  const [filterVisited, setFilterVisited] = useState<VisitedFilter>('all');

  const [sortBy, setSortBy] = useState<SearchSortType>('default');
  const [sortOrders, setSortOrders] = useState<Record<SearchSortType, SortOrder>>(
    DEFAULT_SEARCH_SORT_ORDERS,
  );

  // 検索履歴の永続化（@team/hooksから）
  const { searchHistory, addToHistory, removeFromHistory } = useSearchHistoryStorage({
    storage: AsyncStorage,
    isDev: __DEV__,
  });

  const { filteredShops: baseFilteredShops } = useShopFilter({
    shops,
    searchText: currentSearchText.trim(),
    categories: activeCategories,
    tags: selectedTags,
    sortType: 'default',
  });

  // カテゴリ・タグ抽出（@team/shop-coreから）
  const categoryOptions = useMemo(() => extractCategories(shops), [shops]);
  const tagsByCategory = useMemo(() => extractTagsByCategory(shops), [shops]);

  const hasSearchCriteria =
    currentSearchText.length > 0 || selectedTags.length > 0 || activeCategories.length > 0;

  const handleClearAll = useCallback(() => {
    setUserTypedText('');
    setCurrentSearchText('');
    setActiveCategories([]);
    setSelectedTags([]);
    setSortBy('default');
    setFilterVisited('all');
  }, []);

  const handleSearch = useCallback(
    (textToSearch?: string) => {
      const targetText = textToSearch !== undefined ? textToSearch : userTypedText;
      const trimmedText = targetText.trim();

      if (trimmedText === '') return;

      // 検索履歴を更新（useSearchHistoryStorageから）
      addToHistory(trimmedText);

      setCurrentSearchText(trimmedText);
      if (textToSearch === undefined) {
        setUserTypedText('');
      }
    },
    [userTypedText, addToHistory],
  );

  const handleSearchSortTypePress = useCallback(
    (value: SearchSortType) => {
      if (sortBy !== value) setSortBy(value);
    },
    [sortBy],
  );

  const toggleSortOrder = useCallback(() => {
    setSortOrders(prev => ({
      ...prev,
      [sortBy]: prev[sortBy] === 'desc' ? 'asc' : 'desc',
    }));
  }, [sortBy]);

  const handleRemoveHistory = useCallback(
    (item: string) => {
      removeFromHistory(item);
    },
    [removeFromHistory],
  );

  const handleCategoryPress = useCallback(
    (category: string) => {
      setActiveCategories(prev => {
        const isDeselecting = prev.includes(category);
        if (isDeselecting) {
          const tagsToRemove = tagsByCategory[category] || [];
          setSelectedTags(currentTags => currentTags.filter(tag => !tagsToRemove.includes(tag)));
          return prev.filter(c => c !== category);
        } else {
          return [...prev, category];
        }
      });
    },
    [tagsByCategory],
  );

  const handleTagPress = useCallback((tag: string) => {
    setSelectedTags(prev => (prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]));
  }, []);

  const handleShopPress = useCallback(
    (shopId: string) => {
      router.push(ROUTES.SHOP_DETAIL(shopId));
    },
    [router],
  );

  // ソートラベル取得（@team/shop-coreから）
  const sortOrderLabel = useMemo(
    () => getSortOrderLabel(sortBy, sortOrders[sortBy]),
    [sortBy, sortOrders],
  );

  const searchResults = useMemo(() => {
    if (!hasSearchCriteria) return [];

    let filtered = baseFilteredShops;

    // 訪問済みフィルター（モバイル固有）
    if (filterVisited !== 'all') {
      filtered = filtered.filter(shop =>
        filterVisited === 'visited' ? isVisited(shop.id) : !isVisited(shop.id),
      );
    }

    const currentOrder = sortOrders[sortBy];

    switch (sortBy) {
      case 'newest': {
        const sorted = sortShops(filtered, 'newest');
        filtered = currentOrder === 'asc' ? [...sorted].reverse() : sorted;
        break;
      }
      case 'rating': {
        const sortType = currentOrder === 'asc' ? 'rating-low' : 'rating-high';
        filtered = sortShops(filtered, sortType);
        break;
      }
      case 'registered': {
        const sorted = [...filtered].sort((a, b) => {
          const leftId = getIdNum(a.id);
          const rightId = getIdNum(b.id);
          if (leftId !== 0 || rightId !== 0) {
            return leftId - rightId;
          }
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
        filtered = currentOrder === 'asc' ? sorted : sorted.reverse();
        break;
      }
      default:
        break;
    }

    return filtered;
  }, [baseFilteredShops, filterVisited, hasSearchCriteria, isVisited, sortBy, sortOrders]);

  const formatShopMetaCompact = useCallback((shop: Shop) => formatShopMeta(shop, 'compact'), []);

  const renderHistoryItem = useCallback(
    ({ item }: { item: string }) => (
      <View style={styles.historyItem}>
        <Pressable onPress={() => handleSearch(item)} style={styles.historyTextContainer}>
          <Text style={styles.historyText}>{item}</Text>
        </Pressable>
        <Pressable onPress={() => handleRemoveHistory(item)}>
          <Text style={styles.removeBtn}>✕</Text>
        </Pressable>
      </View>
    ),
    [handleSearch, handleRemoveHistory],
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerTextBlock}>
        <Text style={styles.screenTitle}>お店を検索</Text>
      </View>

      <View style={styles.searchBarContainer}>
        <View style={styles.searchBarRow}>
          <View style={[styles.searchWrapper, styles.shadowLight]}>
            <TextInput
              style={styles.searchInput}
              placeholder='お店名・雰囲気'
              placeholderTextColor={palette.secondaryText}
              value={userTypedText}
              onChangeText={setUserTypedText}
              onSubmitEditing={() => handleSearch()}
              returnKeyType='search'
            />
            <Pressable
              onPress={handleClearAll}
              style={[
                styles.clearButton,
                !userTypedText && !hasSearchCriteria && styles.clearButtonHidden,
              ]}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </Pressable>
          </View>
        </View>

        {currentSearchText.length === 0 && (
          <View style={styles.tagGroupsContainer}>
            <Text style={styles.sectionLabel}>カテゴリから探す（複数選択可）</Text>
            <View style={styles.categoriesRow}>
              {categoryOptions.map(cat => (
                <ToggleButton
                  key={cat}
                  label={cat}
                  isActive={activeCategories.includes(cat)}
                  onPress={() => handleCategoryPress(cat)}
                  style={styles.categoryButton}
                />
              ))}
            </View>

            {activeCategories.length > 0 && (
              <View style={styles.subTagSection}>
                <View style={styles.divider} />

                {activeCategories.map(cat => (
                  <View key={`tags-${cat}`} style={styles.tagGroup}>
                    <Text style={styles.subSectionLabel}>{`${cat}のタグ`}</Text>
                    <View style={styles.tagsRow}>
                      {(tagsByCategory[cat] || []).map(tag => (
                        <ToggleButton
                          key={tag}
                          label={tag}
                          isActive={selectedTags.includes(tag)}
                          onPress={() => handleTagPress(tag)}
                          style={styles.tagButton}
                          size='small'
                        />
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>

      {loading && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>店舗情報を読み込み中...</Text>
        </View>
      )}

      {!loading && loadError && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>{ERROR_MESSAGES.STORE_FETCH_FAILED}</Text>
          <Text style={styles.emptyHistoryText}>{loadError}</Text>
        </View>
      )}

      {!loading && !loadError && hasSearchCriteria && (
        <View>
          <Text style={styles.resultsTitle}>{`検索結果：${searchResults.length}件`}</Text>

          {searchResults.length > 0 ? (
            <View>
              <View style={styles.visitedFilterRow}>
                {VISITED_FILTER_OPTIONS.map(option => (
                  <ToggleButton
                    key={option.value}
                    label={option.label}
                    isActive={filterVisited === option.value}
                    onPress={() => setFilterVisited(option.value)}
                    size='small'
                  />
                ))}
              </View>
              <View style={styles.sortRow}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.sortOptionsScroll}
                  contentContainerStyle={styles.sortOptionsContent}
                >
                  {SEARCH_SORT_OPTIONS.map(option => (
                    <ToggleButton
                      key={option.value}
                      label={option.label}
                      isActive={sortBy === option.value}
                      onPress={() => handleSearchSortTypePress(option.value)}
                      size='small'
                    />
                  ))}
                </ScrollView>
                {sortBy !== 'default' && (
                  <View style={styles.fixedOrderContainer}>
                    <View style={styles.verticalDivider} />
                    <Pressable onPress={toggleSortOrder} style={styles.orderButton}>
                      <Text style={styles.orderButtonText}>{sortOrderLabel}</Text>
                    </Pressable>
                  </View>
                )}
              </View>

              <View style={styles.categorySection}>
                {searchResults.map(item => (
                  <ShopCard
                    key={item.id}
                    shop={item}
                    onPress={handleShopPress}
                    formatMeta={formatShopMetaCompact}
                  />
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>条件に合うお店が見つかりませんでした</Text>
              <Image
                source={require('../../../assets/images/Kuguri_search-Photoroom.png')}
                style={styles.emptyImage}
                resizeMode='contain'
              />
            </View>
          )}
        </View>
      )}

      {!loading && !loadError && !hasSearchCriteria && (
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>検索履歴</Text>
          {searchHistory.length > 0 ? (
            <FlatList
              data={searchHistory}
              keyExtractor={(item, index) => `${item}-${index}`}
              scrollEnabled={false}
              renderItem={renderHistoryItem}
            />
          ) : (
            <View style={styles.emptyHistoryBox}>
              <Text style={styles.emptyHistoryText}>まだ検索履歴がありません</Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.SM,
  },
  categoryButton: {
    borderRadius: BORDER_RADIUS.PILL,
  },
  categorySection: {
    marginBottom: SPACING.XL,
  },
  clearButton: {
    padding: SPACING.SM,
  },
  clearButtonHidden: {
    opacity: 0,
  },
  clearButtonText: {
    color: palette.secondaryText,
    fontFamily: fonts.regular,
    fontSize: 20,
  },
  container: {
    backgroundColor: palette.background,
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: LAYOUT.TAB_BAR_SPACING,
    paddingHorizontal: SPACING.XL,
    paddingTop: SPACING.XXL,
  },
  divider: {
    backgroundColor: palette.border,
    height: 1,
    marginBottom: SPACING.SM,
    marginTop: SPACING.XL,
    opacity: 0.5,
  },
  emptyHistoryBox: {
    alignItems: 'center',
    paddingVertical: SPACING.XXXL,
  },
  emptyHistoryText: {
    color: palette.secondaryText,
    fontFamily: fonts.regular,
    fontSize: 16,
  },
  emptyImage: {
    height: 200,
    width: 280,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.XXXL,
  },
  emptyTitle: {
    color: palette.secondaryText,
    fontFamily: fonts.medium,
    fontSize: 16,
    marginBottom: SPACING.XXXL,
  },
  fixedOrderContainer: {
    alignItems: 'center',
    backgroundColor: palette.background,
    flexDirection: 'row',
    paddingLeft: 4,
  },
  headerTextBlock: {
    marginBottom: SPACING.XXL,
  },
  historyItem: {
    alignItems: 'center',
    borderBottomColor: palette.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.LG,
  },
  historySection: {
    marginTop: SPACING.LG,
  },
  historyText: {
    color: palette.primaryText,
    fontFamily: fonts.regular,
    fontSize: 16,
  },
  historyTextContainer: {
    flex: 1,
  },
  historyTitle: {
    color: palette.primaryText,
    fontFamily: fonts.medium,
    fontSize: 20,
    marginBottom: SPACING.LG,
  },
  orderButton: {
    alignItems: 'center',
    backgroundColor: palette.background,
    borderColor: palette.border,
    borderRadius: BORDER_RADIUS.MEDIUM,
    borderWidth: 1,
    paddingHorizontal: SPACING.MD,
    paddingVertical: 6,
  },
  orderButtonText: {
    color: palette.secondaryText,
    fontFamily: fonts.regular,
    fontSize: 12,
    textAlign: 'center',
  },
  removeBtn: {
    color: palette.secondaryText,
    fontFamily: fonts.regular,
    fontSize: 18,
    padding: SPACING.SM,
  },
  resultsTitle: {
    color: palette.primaryText,
    fontFamily: fonts.medium,
    fontSize: 14,
    marginBottom: SPACING.LG,
  },
  screenTitle: {
    color: palette.primaryText,
    fontFamily: fonts.medium,
    fontSize: 28,
  },
  searchBarContainer: {
    marginBottom: SPACING.LG,
  },
  searchBarRow: {
    flexDirection: 'row',
    marginBottom: SPACING.XL,
  },
  searchInput: {
    color: palette.primaryText,
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 16,
  },
  searchWrapper: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderRadius: BORDER_RADIUS.PILL,
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: SPACING.XL,
    paddingVertical: SPACING.MD,
  },
  sectionLabel: {
    color: palette.secondaryText,
    fontFamily: fonts.medium,
    fontSize: 14,
    marginBottom: SPACING.LG,
  },
  shadowLight: {
    boxShadow: '0px 6px 10px rgba(0, 0, 0, 0.05)',
    elevation: 3,
  },
  sortOptionsContent: {
    alignItems: 'center',
    gap: SPACING.SM,
    paddingRight: SPACING.SM,
  },
  sortOptionsScroll: {
    flex: 1,
    marginRight: SPACING.SM,
  },
  sortRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: SPACING.LG,
  },
  subSectionLabel: {
    color: palette.secondaryText,
    fontFamily: fonts.medium,
    fontSize: 13,
    marginBottom: SPACING.MD,
  },
  subTagSection: {
    marginTop: 0,
  },
  tagButton: {
    borderRadius: BORDER_RADIUS.PILL,
  },
  tagGroup: {
    marginTop: SPACING.LG,
  },
  tagGroupsContainer: {
    backgroundColor: palette.surface,
    borderRadius: BORDER_RADIUS.LARGE,
    padding: SPACING.XL,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.SM,
  },
  verticalDivider: {
    backgroundColor: palette.border,
    height: 18,
    marginRight: SPACING.SM,
    width: 1,
  },
  visitedFilterRow: {
    flexDirection: 'row',
    gap: SPACING.SM,
    marginBottom: SPACING.MD,
  },
});
