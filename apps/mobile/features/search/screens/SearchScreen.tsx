import { palette } from '@/constants/palette';
import { CATEGORIES, SHOPS, type Shop } from '@team/shop-core';
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

const BUDGET_LABEL: Record<Shop['budget'], string> = {
  $: '¥',
  $$: '¥¥',
  $$$: '¥¥¥',
};

const TAB_BAR_SPACING = 129;

const INACTIVE_COLOR = '#f0f0f0';

// 'registered' を追加
type SortType = 'default' | 'newest' | 'rating' | 'registered';
type SortOrder = 'asc' | 'desc'; // asc: 昇順, desc: 降順

const SORT_OPTIONS: { label: string; value: SortType }[] = [
  { label: 'おすすめ', value: 'default' },
  { label: '新着順', value: 'newest' },
  { label: '評価順(★)', value: 'rating' },
  { label: '登録順', value: 'registered' }, // 追加
];

// IDから数値を抽出するヘルパー（登録順用）
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

  // ソートの種類
  const [sortBy, setSortBy] = useState<SortType>('default');

  // 各ソートタイプごとに独立して順序を管理する
  const [sortOrders, setSortOrders] = useState<Record<SortType, SortOrder>>({
    default: 'desc',
    newest: 'desc', // 日付順
    rating: 'desc', // 評価高い順
    registered: 'desc', // ID順（デフォルト：新しい順）
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

  const handleSearch = () => {
    setCurrentSearchText(userTypedText);

    const tagsText = selectedTags.join('・');
    const queryToSave = [userTypedText, tagsText].filter(Boolean).join('・');

    if (queryToSave) {
      const trimmedQuery = queryToSave.trim();
      const filtered = searchHistory.filter(h => h !== trimmedQuery);
      setSearchHistory([trimmedQuery, ...filtered]);
    }

    setUserTypedText('');
    setSelectedTags([]);
    setActiveCategories([]);

    // 検索時はデフォルトに戻す
    setSortBy('default');
    setSortOrders({
      default: 'desc',
      newest: 'desc',
      rating: 'desc',
      registered: 'desc',
    });
  };

  const handleSortTypePress = (value: SortType) => {
    if (sortBy !== value) {
      setSortBy(value);
    }
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

  const handleTagPress = (tag: string) => {
    setSelectedTags(prev => (prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]));
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

  // 現在の状態に応じたボタンのラベルを取得
  const getSortOrderLabel = () => {
    const currentOrder = sortOrders[sortBy];

    switch (sortBy) {
      case 'newest':
        // 日付順：新しい日付が先(desc)なら「新しい順」、逆なら「古い順」
        return currentOrder === 'desc' ? '新しい順' : '古い順';
      case 'registered':
        // ID順：数値が大きい(desc)＝最近登録されたとみなすなら「新しい順」
        // 数値が小さい(asc)＝初期に登録されたとみなすなら「古い順」
        return currentOrder === 'desc' ? '新しい順' : '古い順';
      case 'rating':
        return currentOrder === 'desc' ? '高い順' : '低い順';
      default:
        return '';
    }
  };

  const searchResults = useMemo(() => {
    if (!hasSearchCriteria) {
      return [];
    }

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
                shop.tags.some(shopTag => shopTag.toLowerCase().includes(tag)) ||
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
        case 'newest': {
          // 【変更】新着順 → 日付順 (openedAt を使用)
          const dateA = new Date(a.openedAt).getTime();
          const dateB = new Date(b.openedAt).getTime();
          comparison = dateA - dateB;
          break;
        }

        case 'registered': {
          // 【変更】登録順 → ID順 (数値として比較)
          comparison = getIdNum(a.id) - getIdNum(b.id);
          break;
        }

        case 'rating':
          comparison = a.rating - b.rating;
          break;

        case 'default':
        default:
          return 0;
      }

      // asc(昇順)ならそのまま、desc(降順)なら反転
      return currentOrder === 'asc' ? comparison : -comparison;
    });
  }, [currentSearchText, selectedTags, activeCategories, sortBy, sortOrders, hasSearchCriteria]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* タイトル */}
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
              onPress={() => {
                setUserTypedText('');
                setSelectedTags([]);
                setActiveCategories([]);
              }}
              style={[styles.clearButton, !userTypedText && styles.clearButtonHidden]}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </Pressable>
          </View>
        </View>

        {currentSearchText.length === 0 && (
          <View style={styles.tagGroupsContainer}>
            <Text style={styles.sectionLabel}>カテゴリから探す（複数選択可）</Text>

            <View style={styles.categoriesRow}>
              {CATEGORY_OPTIONS.map(cat => {
                const isActive = activeCategories.includes(cat);
                return (
                  <Pressable
                    key={cat}
                    onPress={() => handleCategoryPress(cat)}
                    style={[
                      styles.categoryButton,
                      isActive ? styles.categoryButtonActive : styles.categoryButtonInactive,
                    ]}
                  >
                    <Text
                      style={
                        isActive
                          ? styles.categoryButtonTextActive
                          : styles.categoryButtonTextInactive
                      }
                    >
                      {cat}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {activeCategories.length > 0 && (
              <View style={styles.subTagsContainer}>
                {activeCategories.map((cat, index) => {
                  const tags = TAGS_BY_CATEGORY[cat];
                  if (!tags) return null;

                  return (
                    <View key={cat} style={index > 0 ? styles.subTagGroupMargin : undefined}>
                      <Text style={styles.subSectionLabel}>{cat}のタグ</Text>
                      <View style={styles.tagChipsWrapper}>
                        {tags.map(tag => (
                          <Pressable
                            key={tag}
                            onPress={() => handleTagPress(tag)}
                            style={[
                              styles.tagChipSmall,
                              selectedTags.includes(tag)
                                ? styles.tagChipSmallSelected
                                : styles.tagChipSmallUnselected,
                            ]}
                          >
                            <Text
                              style={
                                selectedTags.includes(tag)
                                  ? styles.tagChipSmallTextSelected
                                  : styles.tagChipSmallTextUnselected
                              }
                            >
                              {tag}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </View>

      {hasSearchCriteria && (
        <View style={styles.resultsSection}>
          <Text style={styles.resultsTitle}>{`検索結果：${searchResults.length}件`}</Text>

          {/* ▼▼▼ ここから修正：横スクロールと固定ボタンのレイアウト ▼▼▼ */}
          <View style={styles.sortRow}>
            {/* 左側：項目選択（残りの幅いっぱいに横スクロール） */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.sortOptionsScroll}
              contentContainerStyle={styles.sortOptionsContent}
            >
              {SORT_OPTIONS.map(option => {
                const isActive = sortBy === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => handleSortTypePress(option.value)}
                    style={[
                      styles.sortButton,
                      isActive ? styles.sortButtonActive : styles.sortButtonInactive,
                    ]}
                  >
                    <Text
                      style={isActive ? styles.sortButtonTextActive : styles.sortButtonTextInactive}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* 右側：順序切り替え（固定表示エリア） */}
            {sortBy !== 'default' && (
              <View style={styles.fixedOrderContainer}>
                {/* 境界線 */}
                <View style={styles.verticalDivider} />

                <Pressable onPress={toggleSortOrder} style={styles.orderButton}>
                  {/* ▼▼▼ 修正: 矢印アイコンを削除し、テキストのみにしました ▼▼▼ */}
                  <Text style={styles.orderButtonText}>{getSortOrderLabel()}</Text>
                </Pressable>
              </View>
            )}
          </View>
          {/* ▲▲▲ 修正ここまで ▲▲▲ */}

          {searchResults.length > 0 ? (
            <View>
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
                        {item.category} • 徒歩{item.distanceMinutes}分 • 予算{' '}
                        {BUDGET_LABEL[item.budget]}
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
            </View>
          )}
        </View>
      )}

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
            <Text style={styles.emptyHistoryText}>まだ検索履歴がありません</Text>
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
    marginBottom: 0,
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
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
    marginRight: 4,
    paddingHorizontal: 8,
    paddingVertical: 8,
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
  },
  emptyHistoryText: {
    color: palette.secondaryText,
    fontSize: 16,
    paddingVertical: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    color: palette.secondaryText,
    fontSize: 14,
  },
  fixedOrderContainer: {
    alignItems: 'center',
    backgroundColor: palette.background,
    flexDirection: 'row',
    paddingLeft: 4,
  },
  headerTextBlock: {
    marginBottom: 16,
  },
  historyItem: {
    alignItems: 'center',
    borderBottomColor: palette.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
    paddingVertical: 12,
  },
  historySection: {
    marginTop: 20,
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
    marginBottom: 12,
  },
  orderButton: {
    alignItems: 'center',
    backgroundColor: palette.background,
    borderColor: palette.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  orderButtonText: {
    color: palette.secondaryText,
    fontSize: 12,
    minWidth: 50,
    textAlign: 'center',
  },
  ratingBadge: {
    backgroundColor: palette.highlight,
    borderRadius: 999,
    marginLeft: 8,
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
    marginBottom: 12,
  },
  screenTitle: {
    color: palette.primaryText,
    fontSize: 28,
    fontWeight: '700',
  },
  searchBarContainer: {
    marginBottom: 24,
  },
  searchBarRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
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
    paddingVertical: 8,
  },
  sectionLabel: {
    color: palette.secondaryText,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 0,
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
    elevation: 2,
    flexDirection: 'row',
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: palette.shadow,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
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
    flex: 1,
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
    height: 36,
    marginBottom: 16,
  },
  subSectionLabel: {
    color: palette.secondaryText,
    fontSize: 12,
    marginBottom: 12,
  },
  subTagGroupMargin: {
    borderTopWidth: 0,
    marginTop: 24,
  },
  subTagsContainer: {
    borderTopColor: palette.border,
    borderTopWidth: 1,
    marginTop: 16,
    paddingTop: 16,
  },
  tagChipSmall: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tagChipSmallSelected: {
    backgroundColor: palette.primaryText,
  },
  tagChipSmallTextSelected: {
    color: palette.surface,
    fontSize: 12,
  },
  tagChipSmallTextUnselected: {
    color: palette.tertiaryText,
    fontSize: 12,
  },
  tagChipSmallUnselected: {
    backgroundColor: INACTIVE_COLOR,
  },
  tagChipsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagGroupsContainer: {
    backgroundColor: palette.surface,
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
  },
  verticalDivider: {
    backgroundColor: palette.border,
    height: 18,
    marginRight: 8,
    width: 1,
  },
});
