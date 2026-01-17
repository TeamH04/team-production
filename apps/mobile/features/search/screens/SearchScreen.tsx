import { BORDER_RADIUS, ERROR_MESSAGES, FONT_WEIGHT, ROUTES, SPACING } from '@team/constants';
import { sortShops, type Shop } from '@team/shop-core';
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
import { ToggleButton } from '@/components/ToggleButton';
import { palette } from '@/constants/palette';
import { TAB_BAR_SPACING } from '@/constants/TabBarSpacing';
import { useStores } from '@/features/stores/StoresContext';
import { useVisited } from '@/features/visited/VisitedContext';
import { useShopFilter } from '@/hooks/useShopFilter';

type SortType = 'default' | 'newest' | 'rating' | 'registered';
type SortOrder = 'asc' | 'desc';
type VisitedFilter = 'all' | 'visited' | 'not_visited';

const SORT_OPTIONS: { label: string; value: SortType }[] = [
  { label: 'おすすめ', value: 'default' },
  { label: '新着順', value: 'newest' },
  { label: '評価順(★)', value: 'rating' },
  { label: '登録順', value: 'registered' },
];

const VISITED_FILTER_OPTIONS: { label: string; value: VisitedFilter }[] = [
  { label: 'すべて', value: 'all' },
  { label: '訪問済み', value: 'visited' },
  { label: '未訪問', value: 'not_visited' },
];

const getIdNum = (id: string) => {
  if (!id) return 0;
  const normalized = id.replace(/[０-９]/g, s => {
    return String.fromCharCode(s.charCodeAt(0) - 0xfee0);
  });
  const match = normalized.match(/(\d+)/);
  if (match) {
    return parseInt(match[0], 10);
  }
  return 0;
};

export default function SearchScreen() {
  const router = useRouter();
  const { isVisited } = useVisited();
  const [userTypedText, setUserTypedText] = useState('');
  const [currentSearchText, setCurrentSearchText] = useState('');
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const { stores: shops, loading, error: loadError } = useStores();
  const [filterVisited, setFilterVisited] = useState<VisitedFilter>('all');

  const [sortBy, setSortBy] = useState<SortType>('default');
  const [sortOrders, setSortOrders] = useState<Record<SortType, SortOrder>>({
    default: 'desc',
    newest: 'desc',
    rating: 'desc',
    registered: 'desc',
  });

  const { filteredShops: baseFilteredShops } = useShopFilter({
    shops,
    searchText: currentSearchText.trim(),
    categories: activeCategories,
    tags: selectedTags,
    sortType: 'default',
  });

  const CATEGORY_OPTIONS = useMemo(() => {
    const set = new Set<string>();
    for (const shop of shops) {
      set.add(shop.category);
    }
    return Array.from(set).sort();
  }, [shops]);

  const TAGS_BY_CATEGORY = useMemo(() => {
    const m = new Map<string, Set<string>>();
    shops.forEach(shop => {
      const cat = shop.category;

      let set = m.get(cat);
      if (!set) {
        set = new Set<string>();
        m.set(cat, set);
      }

      for (const t of shop.tags) {
        set.add(t);
      }
    });
    return Object.fromEntries(
      Array.from(m.entries(), ([cat, set]) => [cat, Array.from(set).sort()] as const),
    ) as Record<string, string[]>;
  }, [shops]);

  const hasSearchCriteria =
    currentSearchText.length > 0 || selectedTags.length > 0 || activeCategories.length > 0;

  const handleClearAll = () => {
    setUserTypedText('');
    setCurrentSearchText('');
    setActiveCategories([]);
    setSelectedTags([]);
    setSortBy('default');
    setFilterVisited('all');
  };

  const handleSearch = (textToSearch?: string) => {
    const targetText = textToSearch !== undefined ? textToSearch : userTypedText;
    const trimmedText = targetText.trim();

    if (trimmedText === '') return;

    // 検索履歴を更新
    setSearchHistory(prev => {
      // 既にある場合は一旦消して、配列の先頭に追加（重複防止）
      const filtered = prev.filter(item => item !== trimmedText);
      return [trimmedText, ...filtered].slice(0, 10); // 最大10件
    });

    setCurrentSearchText(trimmedText);
    if (textToSearch === undefined) {
      setUserTypedText('');
    }
  };

  const handleSortTypePress = (value: SortType) => {
    if (sortBy !== value) setSortBy(value);
  };

  const toggleSortOrder = () => {
    setSortOrders(prev => ({
      ...prev,
      [sortBy]: prev[sortBy] === 'desc' ? 'asc' : 'desc',
    }));
  };

  const handleRemoveHistory = (item: string) => {
    setSearchHistory(searchHistory.filter(h => h !== item));
  };

  const handleCategoryPress = (category: string) => {
    setActiveCategories(prev => {
      const isDeselecting = prev.includes(category);
      if (isDeselecting) {
        const tagsToRemove = TAGS_BY_CATEGORY[category] || [];
        setSelectedTags(currentTags => currentTags.filter(tag => !tagsToRemove.includes(tag)));
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  const handleTagPress = (tag: string) => {
    setSelectedTags(prev => (prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]));
  };

  const handleShopPress = useCallback(
    (shopId: string) => {
      router.push(ROUTES.SHOP_DETAIL(shopId));
    },
    [router],
  );

  const formatSearchMeta = useCallback(
    (shop: Shop) =>
      `${shop.category}${shop.budget ? ` • ${shop.budget}` : ''} • 徒歩${shop.distanceMinutes}分`,
    [],
  );

  const getSortOrderLabel = () => {
    const currentOrder = sortOrders[sortBy];
    switch (sortBy) {
      case 'newest':
      case 'registered':
        return currentOrder === 'desc' ? '新しい順' : '古い順';
      case 'rating':
        return currentOrder === 'desc' ? '高い順' : '低い順';
      default:
        return '';
    }
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
              {CATEGORY_OPTIONS.map(cat => (
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
                      {(TAGS_BY_CATEGORY[cat] || []).map(tag => (
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
        <View style={styles.resultsSection}>
          <Text style={styles.resultsTitle}>{`検索結果：${searchResults.length}件`}</Text>

          <View style={styles.visitedFilterRow}>
            {VISITED_FILTER_OPTIONS.map(option => (
              <ToggleButton
                key={option.value}
                label={option.label}
                isActive={filterVisited === option.value}
                onPress={() => setFilterVisited(option.value)}
                style={styles.visitedFilterButton}
                size='small'
              />
            ))}
          </View>

          {searchResults.length > 0 ? (
            <View>
              <View style={styles.sortRow}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.sortOptionsScroll}
                  contentContainerStyle={styles.sortOptionsContent}
                >
                  {SORT_OPTIONS.map(option => (
                    <ToggleButton
                      key={option.value}
                      label={option.label}
                      isActive={sortBy === option.value}
                      onPress={() => handleSortTypePress(option.value)}
                      style={styles.sortButton}
                      size='small'
                    />
                  ))}
                </ScrollView>
                {sortBy !== 'default' && (
                  <View style={styles.fixedOrderContainer}>
                    <View style={styles.verticalDivider} />
                    <Pressable onPress={toggleSortOrder} style={styles.orderButton}>
                      <Text style={styles.orderButtonText}>{getSortOrderLabel()}</Text>
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
                    formatMeta={formatSearchMeta}
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
              renderItem={({ item }) => (
                <View style={styles.historyItem}>
                  {/* タップした時にその履歴ワードで再検索を実行 */}
                  <Pressable onPress={() => handleSearch(item)} style={styles.historyTextContainer}>
                    <Text style={styles.historyText}>{item}</Text>
                  </Pressable>
                  <Pressable onPress={() => handleRemoveHistory(item)}>
                    <Text style={styles.removeBtn}>✕</Text>
                  </Pressable>
                </View>
              )}
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
    marginBottom: 24,
  },
  clearButton: {
    padding: SPACING.SM,
  },
  clearButtonHidden: {
    opacity: 0,
  },
  clearButtonText: {
    color: palette.secondaryText,
    fontSize: 20,
  },
  container: {
    backgroundColor: palette.background,
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: TAB_BAR_SPACING,
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
    paddingVertical: 60,
  },
  emptyHistoryText: {
    color: palette.secondaryText,
    fontSize: 16,
  },
  emptyImage: {
    height: 200,
    width: 280,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    color: palette.secondaryText,
    fontSize: 16,
    fontWeight: FONT_WEIGHT.SEMIBOLD,
    marginBottom: 40,
  },
  fixedOrderContainer: {
    alignItems: 'center',
    backgroundColor: palette.background,
    flexDirection: 'row',
    paddingLeft: 4,
  },
  headerTextBlock: {
    marginBottom: 32,
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
    fontSize: 16,
  },
  historyTextContainer: {
    flex: 1,
  },
  historyTitle: {
    color: palette.primaryText,
    fontSize: 20,
    fontWeight: FONT_WEIGHT.SEMIBOLD,
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
    fontSize: 12,
    textAlign: 'center',
  },
  removeBtn: {
    color: palette.secondaryText,
    fontSize: 18,
    padding: SPACING.SM,
  },
  resultsSection: {},
  resultsTitle: {
    color: palette.primaryText,
    fontSize: 14,
    fontWeight: FONT_WEIGHT.SEMIBOLD,
    marginBottom: SPACING.LG,
  },
  screenTitle: {
    color: palette.primaryText,
    fontSize: 28,
    fontWeight: '700',
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
    fontSize: 16,
  },
  searchWrapper: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderRadius: 24,
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: SPACING.XL,
    paddingVertical: 10,
  },
  sectionLabel: {
    color: palette.secondaryText,
    fontSize: 14,
    fontWeight: FONT_WEIGHT.SEMIBOLD,
    marginBottom: SPACING.LG,
  },
  shadowLight: {
    elevation: 3,
    shadowColor: palette.shadow,
    shadowOffset: {
      height: 6,
      width: 0,
    },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  sortButton: {},
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
    fontSize: 13,
    fontWeight: FONT_WEIGHT.SEMIBOLD,
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
  visitedFilterButton: {},
  visitedFilterRow: {
    flexDirection: 'row',
    gap: SPACING.SM,
    marginBottom: SPACING.MD,
  },
});
