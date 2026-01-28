/* global __DEV__ */
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BORDER_RADIUS,
  ERROR_MESSAGES,
  FAVORITES_SORT_OPTIONS,
  LAYOUT,
  ROUTES,
  SPACING,
  VISITED_FILTER_OPTIONS,
} from '@team/constants';
import { useSearchHistoryStorage, useShopFilter } from '@team/hooks';
import { palette, ToggleButton } from '@team/mobile-ui';
import {
  extractCategories,
  extractTagsByCategory,
  formatShopMeta,
  type SortType,
} from '@team/shop-core';
import { withAlpha } from '@team/theme';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SearchBar } from '@/components/SearchBar';
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
  const [sortType, setSortType] = useState<SortType>('newest');
  const [showSortModal, setShowSortModal] = useState(false);

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
    sortType,
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
    setSortType('newest');
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

  const handleSortSelect = useCallback((value: SortType) => {
    setSortType(value);
    setShowSortModal(false);
  }, []);

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

  const getCurrentSortLabel = () => {
    const option = FAVORITES_SORT_OPTIONS.find(opt => opt.value === sortType);
    return option?.label || '新着順';
  };

  const searchResults = useMemo(() => {
    if (!hasSearchCriteria) return [];

    let filtered = baseFilteredShops;

    // 訪問済みフィルター（モバイル固有）
    if (filterVisited !== 'all') {
      filtered = filtered.filter(shop =>
        filterVisited === 'visited' ? isVisited(shop.id) : !isVisited(shop.id),
      );
    }

    return filtered;
  }, [baseFilteredShops, filterVisited, hasSearchCriteria, isVisited]);

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

      {/* 検索・ソート操作パネル */}
      <View style={styles.controlPanel}>
        {/* 検索バー */}
        <SearchBar
          value={userTypedText}
          onChangeText={setUserTypedText}
          onClear={handleClearAll}
          onSubmitEditing={() => handleSearch()}
          showClearButton={userTypedText.length > 0 || hasSearchCriteria}
          accessibilityLabel='店舗検索'
        />

        {/* ソートボタン */}
        <Pressable
          style={styles.sortButton}
          onPress={() => setShowSortModal(true)}
          accessibilityLabel='ソートオプション'
          accessibilityHint={`現在のソート：${getCurrentSortLabel()}`}
          accessibilityRole='button'
        >
          <Ionicons name='funnel' size={18} color={palette.primaryText} />
          <Text style={styles.sortButtonText}>{getCurrentSortLabel()}</Text>
        </Pressable>
      </View>

      {/* ソートモーダル */}
      <Modal
        visible={showSortModal}
        transparent={true}
        animationType='fade'
        onRequestClose={() => setShowSortModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowSortModal(false)}>
          <View style={styles.sortModalContent}>
            <FlatList
              data={FAVORITES_SORT_OPTIONS}
              keyExtractor={item => item.value}
              scrollEnabled={false}
              contentContainerStyle={styles.sortOptionsList}
              style={styles.sortOptionsFlatList}
              ItemSeparatorComponent={() => <View style={styles.sortOptionSeparator} />}
              renderItem={({ item: option }) => (
                <Pressable
                  style={[styles.sortOption, sortType === option.value && styles.sortOptionActive]}
                  onPress={() => handleSortSelect(option.value)}
                >
                  <Text
                    style={[
                      styles.sortOptionText,
                      sortType === option.value && styles.sortOptionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {sortType === option.value && (
                    <Ionicons name='checkmark' size={20} color={palette.primary} />
                  )}
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>

      <View style={styles.searchBarContainer}>
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

          {searchResults.length > 0 ? (
            <View>
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
  controlPanel: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
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
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: withAlpha('#000000', 0.5),
    flex: 1,
    justifyContent: 'center',
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
  sectionLabel: {
    color: palette.secondaryText,
    fontFamily: fonts.medium,
    fontSize: 14,
    marginBottom: SPACING.LG,
  },
  sortButton: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sortButtonText: {
    color: palette.primaryText,
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  sortModalContent: {
    backgroundColor: palette.surface,
    borderRadius: 12,
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
    maxHeight: 300,
    minWidth: 250,
    overflow: 'hidden',
    width: 280,
  },
  sortOption: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  sortOptionActive: {
    backgroundColor: palette.highlight,
  },
  sortOptionSeparator: {
    backgroundColor: palette.border,
    height: 1,
  },
  sortOptionText: {
    color: palette.primaryText,
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  sortOptionTextActive: {
    // fontWeight is handled by fontFamily fonts.medium
  },
  sortOptionsFlatList: {
    width: 280,
  },
  sortOptionsList: {
    flexGrow: 0,
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
  visitedFilterRow: {
    flexDirection: 'row',
    gap: SPACING.SM,
    marginBottom: SPACING.MD,
  },
});
