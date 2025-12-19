import { palette } from '@/constants/palette';
import { CATEGORIES, SHOPS } from '@team/shop-core';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
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

const TAB_BAR_SPACING = 129;
const INACTIVE_COLOR = '#f0f0f0';

type SortType = 'default' | 'newest' | 'rating' | 'registered';
type SortOrder = 'asc' | 'desc';

const SORT_OPTIONS: { label: string; value: SortType }[] = [
  { label: 'おすすめ', value: 'default' },
  { label: '新着順', value: 'newest' },
  { label: '評価順(★)', value: 'rating' },
  { label: '登録順', value: 'registered' },
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
  const [userTypedText, setUserTypedText] = useState('');
  const [currentSearchText, setCurrentSearchText] = useState('');
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const [sortBy, setSortBy] = useState<SortType>('default');
  const [sortOrders, setSortOrders] = useState<Record<SortType, SortOrder>>({
    default: 'desc',
    newest: 'desc',
    rating: 'desc',
    registered: 'desc',
  });

  const CATEGORY_OPTIONS = useMemo(() => [...CATEGORIES].sort(), []);

  const TAGS_BY_CATEGORY = useMemo(() => {
    const m = new Map<string, Set<string>>();
    SHOPS.forEach(shop => {
      const cat = shop.category;
      if (!m.has(cat)) m.set(cat, new Set());
      shop.tags.forEach(t => m.get(cat)!.add(t));
    });
    const out: Record<string, string[]> = {};
    Array.from(m.entries()).forEach(([cat, s]) => (out[cat] = Array.from(s).sort()));
    return out;
  }, []);

  const hasSearchCriteria =
    currentSearchText.length > 0 || selectedTags.length > 0 || activeCategories.length > 0;

  // ★ ✕ボタン用：すべての状態をクリアして初期画面に戻る関数
  const handleClearAll = () => {
    setUserTypedText('');
    setCurrentSearchText('');
    setActiveCategories([]);
    setSelectedTags([]);
    setSortBy('default');
  };

  const handleSearch = () => {
    setCurrentSearchText(userTypedText);
    const tagsText = selectedTags.join('・');
    const queryToSave = [userTypedText, tagsText].filter(Boolean).join('・');

    if (queryToSave) {
      const trimmedQuery = queryToSave.trim();
      const filtered = searchHistory.filter(h => h !== trimmedQuery);
      setSearchHistory([trimmedQuery, ...filtered]);
    }

    setSelectedTags([]);
    setActiveCategories([]);
    setSortBy('default');
    setSortOrders({
      default: 'desc',
      newest: 'desc',
      rating: 'desc',
      registered: 'desc',
    });
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

  const handleShopPress = (shopId: string) => {
    router.push({ pathname: '/shop/[id]', params: { id: shopId } });
  };

  const getSortOrderLabel = () => {
    const currentOrder = sortOrders[sortBy];
    switch (sortBy) {
      case 'newest':
        return currentOrder === 'desc' ? '新しい順' : '古い順';
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
    const q = currentSearchText.trim().toLowerCase();
    const tags = selectedTags.map(t => t.toLowerCase());
    const hasCategories = activeCategories.length > 0;

    let filtered = SHOPS.filter(shop => {
      const matchesText =
        q.length > 0
          ? shop.name.toLowerCase().includes(q) ||
            shop.description.toLowerCase().includes(q) ||
            shop.category.toLowerCase().includes(q) ||
            (shop.menu?.some(item => item.name.toLowerCase().includes(q)) ?? false)
          : true;
      const matchesTags =
        tags.length > 0
          ? tags.some(
              tag =>
                shop.tags.some(st => st.toLowerCase().includes(tag)) ||
                shop.category.toLowerCase().includes(tag)
            )
          : true;
      const matchesCategory = hasCategories ? activeCategories.includes(shop.category) : true;
      return matchesText && matchesTags && matchesCategory;
    });

    return filtered.sort((a, b) => {
      let comparison = 0;
      const currentOrder = sortOrders[sortBy];
      switch (sortBy) {
        case 'newest':
          comparison = new Date(a.openedAt).getTime() - new Date(b.openedAt).getTime();
          break;
        case 'registered':
          comparison = getIdNum(a.id) - getIdNum(b.id);
          break;
        case 'rating':
          comparison = a.rating - b.rating;
          break;
        default:
          return 0;
      }
      return currentOrder === 'asc' ? comparison : -comparison;
    });
  }, [currentSearchText, selectedTags, activeCategories, sortBy, sortOrders, hasSearchCriteria]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. お店を検索（ヘッダー） */}
      <View style={styles.headerTextBlock}>
        <Text style={styles.screenTitle}>お店を検索</Text>
      </View>

      {/* 2. 検索バー */}
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
            {/* ✕ボタンの動作を handleClearAll に変更 */}
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
                <Pressable
                  key={cat}
                  onPress={() => handleCategoryPress(cat)}
                  style={[
                    styles.categoryButton,
                    activeCategories.includes(cat)
                      ? styles.categoryButtonActive
                      : styles.categoryButtonInactive,
                  ]}
                >
                  <Text
                    style={
                      activeCategories.includes(cat)
                        ? styles.categoryButtonTextActive
                        : styles.categoryButtonTextInactive
                    }
                  >
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* 3. 検索結果 */}
      {hasSearchCriteria && (
        <View style={styles.resultsSection}>
          {searchResults.length > 0 ? (
            <View>
              <Text style={styles.resultsTitle}>{`検索結果：${searchResults.length}件`}</Text>
              <View style={styles.sortRow}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.sortOptionsScroll}
                  contentContainerStyle={styles.sortOptionsContent}
                >
                  {SORT_OPTIONS.map(option => (
                    <Pressable
                      key={option.value}
                      onPress={() => handleSortTypePress(option.value)}
                      style={[
                        styles.sortButton,
                        sortBy === option.value
                          ? styles.sortButtonActive
                          : styles.sortButtonInactive,
                      ]}
                    >
                      <Text
                        style={
                          sortBy === option.value
                            ? styles.sortButtonTextActive
                            : styles.sortButtonTextInactive
                        }
                      >
                        {option.label}
                      </Text>
                    </Pressable>
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
                  <Pressable
                    key={item.id}
                    onPress={() => handleShopPress(item.id)}
                    style={styles.shopCard}
                  >
                    <Image source={{ uri: item.imageUrl }} style={styles.shopImage} />
                    <View style={styles.shopInfo}>
                      <View style={styles.shopHeader}>
                        <Text style={styles.shopName}>{item.name}</Text>
                        <View style={styles.ratingBadge}>
                          <Text style={styles.ratingText}>{`★ ${item.rating.toFixed(1)}`}</Text>
                        </View>
                      </View>
                      <Text style={styles.shopMeta}>
                        {item.category} • 徒歩{item.distanceMinutes}分
                      </Text>
                      <Text style={styles.shopDescription} numberOfLines={2}>
                        {item.description}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>条件に合うお店が見つかりませんでした</Text>
              <View style={styles.emptyImageContainer}>
                <Image
                  source={require('../../../assets/images/Kuguri_search-Photoroom.png')}
                  style={styles.emptyImage}
                  resizeMode='contain'
                  onError={() => console.log('Image load error: Path might be wrong')}
                />
              </View>
            </View>
          )}
        </View>
      )}

      {/* 4. 検索履歴 / まだ検索履歴がありません */}
      {!hasSearchCriteria && (
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>検索履歴</Text>
          {searchHistory.length > 0 ? (
            <FlatList
              data={searchHistory}
              keyExtractor={(item, index) => `${item}-${index}`}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.historyItem}>
                  <Pressable onPress={() => handleSearch()} style={styles.historyTextContainer}>
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
    gap: 8,
  },
  categoryButton: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoryButtonActive: {
    backgroundColor: palette.primaryText,
  },
  categoryButtonInactive: {
    backgroundColor: INACTIVE_COLOR,
  },
  categoryButtonTextActive: {
    color: palette.surface,
    fontSize: 14,
    fontWeight: '600',
  },
  categoryButtonTextInactive: {
    color: palette.tertiaryText,
    fontSize: 14,
  },
  categorySection: {
    marginBottom: 24,
  },
  clearButton: {
    padding: 8,
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
    paddingHorizontal: 20,
    paddingTop: 24,
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
  emptyImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    color: palette.secondaryText,
    fontSize: 16,
    fontWeight: '600',
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
    paddingVertical: 16,
  },
  historySection: {
    marginTop: 16,
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
    fontWeight: '600',
    marginBottom: 16,
  },
  orderButton: {
    alignItems: 'center',
    backgroundColor: palette.background,
    borderColor: palette.border,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  orderButtonText: {
    color: palette.secondaryText,
    fontSize: 12,
    textAlign: 'center',
  },
  ratingBadge: {
    backgroundColor: palette.highlight,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ratingText: {
    color: palette.ratingText,
    fontSize: 11,
    fontWeight: '600',
  },
  removeBtn: {
    color: palette.secondaryText,
    fontSize: 18,
    padding: 8,
  },
  resultsSection: {},
  resultsTitle: {
    color: palette.primaryText,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
  },
  screenTitle: {
    color: palette.primaryText,
    fontSize: 28,
    fontWeight: '700',
  },
  searchBarContainer: {
    marginBottom: 16,
  },
  searchBarRow: {
    flexDirection: 'row',
    marginBottom: 20,
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
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sectionLabel: {
    color: palette.secondaryText,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
  },
  shadowLight: {
    elevation: 3,
    shadowColor: palette.shadow,
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  shopCard: {
    backgroundColor: palette.surface,
    borderRadius: 12,
    flexDirection: 'row',
    marginBottom: 12,
    overflow: 'hidden',
  },
  shopDescription: {
    color: palette.secondaryText,
    fontSize: 12,
    lineHeight: 16,
  },
  shopHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  shopImage: {
    height: 100,
    width: 100,
  },
  shopInfo: {
    flex: 1,
    padding: 12,
  },
  shopMeta: {
    color: palette.secondaryText,
    fontSize: 12,
    marginBottom: 4,
  },
  shopName: {
    color: palette.primaryText,
    fontSize: 14,
    fontWeight: '600',
  },
  sortButton: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sortButtonActive: {
    backgroundColor: palette.primaryText,
    borderColor: palette.primaryText,
  },
  sortButtonInactive: {
    backgroundColor: palette.background,
    borderColor: palette.border,
  },
  sortButtonTextActive: {
    color: palette.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  sortButtonTextInactive: {
    color: palette.secondaryText,
    fontSize: 12,
  },
  sortOptionsContent: {
    alignItems: 'center',
    gap: 8,
    paddingRight: 8,
  },
  sortOptionsScroll: {
    flex: 1,
    marginRight: 8,
  },
  sortRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 16,
  },
  tagGroupsContainer: {
    backgroundColor: palette.surface,
    borderRadius: 12,
    padding: 20,
  },
  verticalDivider: {
    backgroundColor: palette.border,
    height: 18,
    marginRight: 8,
    width: 1,
  },
});
