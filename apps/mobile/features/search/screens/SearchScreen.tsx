import { palette } from '@/constants/palette';
import { CATEGORIES, SHOPS, type Shop } from '@/features/home/data/shops';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
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
export default function SearchScreen() {
  const router = useRouter();
  const [userTypedText, setUserTypedText] = useState('');
  const [searchText, setSearchText] = useState('');
  const [currentSearchText, setCurrentSearchText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  useEffect(() => {
    const tagsText = selectedTags.join('・');
    const newSearchText = [userTypedText, tagsText].filter(Boolean).join('・');
    setSearchText(newSearchText);
  }, [userTypedText, selectedTags]);

  const handleSearch = () => {
    // 検索条件をセット
    setCurrentSearchText(userTypedText);

    // 検索履歴に追加
    if (searchText) {
      const trimmedQuery = searchText.trim();
      const filtered = searchHistory.filter(h => h !== trimmedQuery);
      setSearchHistory([trimmedQuery, ...filtered]);
    }

    // 入力と選択をクリア
    setUserTypedText('');
    setSelectedTags([]);
  };

  const handleRemoveHistory = (item: string) => {
    setSearchHistory(searchHistory.filter(h => h !== item));
  };

  const handleTagPress = (tag: string) => {
    setSelectedTags(prev => (prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]));
  };

  const handleShopPress = (shopId: string) => {
    router.push({ pathname: '/shop/[id]', params: { id: shopId } });
  };

  const CATEGORY_OPTIONS = useMemo(() => [...CATEGORIES].sort(), []);
  // タグ一覧をカテゴリごとに一意化して抽出（カテゴリ別表示）
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

  const searchResults = useMemo(() => {
    const q = currentSearchText.trim().toLowerCase();
    const tags = selectedTags.map(t => t.toLowerCase());

    if (q.length === 0 && tags.length === 0) {
      return [];
    }

    return SHOPS.filter(shop => {
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

      if (q.length > 0 && tags.length > 0) {
        return matchesText && matchesTags;
      }
      if (q.length > 0) {
        return matchesText;
      }
      if (tags.length > 0) {
        return matchesTags;
      }
      return false;
    });
  }, [currentSearchText, selectedTags]);

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.containerContent}
      keyboardShouldPersistTaps='handled'
    >
      {/* タイトル */}
      <View style={styles.headerTextBlock}>
        <Text style={styles.screenTitle}>お店を検索</Text>
      </View>

      {/* 検索バー */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBarRow}>
          <View style={[styles.searchWrapper, styles.shadowLight]}>
            <TextInput
              style={styles.searchInput}
              placeholder='お店名・雰囲気・タグで検索'
              placeholderTextColor={palette.secondaryText}
              value={searchText}
              onChangeText={setUserTypedText}
              onSubmitEditing={() => handleSearch()}
            />
            <Pressable
              onPress={() => {
                setUserTypedText('');
                setSelectedTags([]);
              }}
              style={[styles.clearButton, !searchText && styles.clearButtonHidden]}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </Pressable>
          </View>
          <Pressable onPress={() => handleSearch()} style={styles.searchButton}>
            <Text style={styles.searchButtonText}>検索する</Text>
          </Pressable>
        </View>

        {/* タグチップ */}
        {currentSearchText.length === 0 && (
          <View style={styles.tagGroupsContainer}>
            {CATEGORY_OPTIONS.map(cat => {
              const tags = TAGS_BY_CATEGORY[cat] ?? [];
              if (tags.length === 0) return null;
              return (
                <View key={cat} style={styles.tagGroup}>
                  <Pressable
                    onPress={() => {
                      handleTagPress(cat);
                    }}
                    style={[
                      styles.categoryChip,
                      selectedTags.includes(cat)
                        ? styles.categoryChipSelected
                        : styles.categoryChipUnselected,
                    ]}
                  >
                    <Text
                      style={
                        selectedTags.includes(cat)
                          ? styles.categoryChipTextSelected
                          : styles.categoryChipTextUnselected
                      }
                    >
                      {cat}
                    </Text>
                  </Pressable>
                  <View style={styles.tagChipsContainer}>
                    {tags.map(tag => (
                      <Pressable
                        key={tag}
                        onPress={() => {
                          handleTagPress(tag);
                        }}
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

      {/* 検索結果の表示 */}
      {(currentSearchText.length > 0 || selectedTags.length > 0) && (
        <View style={styles.resultsSection}>
          <Text style={styles.resultsTitle}>
            {`「${[currentSearchText, ...selectedTags]
              .filter(Boolean)
              .join(' ')}」の検索結果：${searchResults.length}件`}
          </Text>

          {searchResults.length > 0 ? (
            <ScrollView showsVerticalScrollIndicator={false}>
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
            </ScrollView>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>条件に合うお店が見つかりませんでした</Text>
            </View>
          )}
        </View>
      )}

      {/* 検索履歴 */}
      {currentSearchText.length === 0 && selectedTags.length === 0 && (
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
  categoryChip: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 8,
    marginRight: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  categoryChipSelected: {
    backgroundColor: palette.primaryText,
    borderColor: palette.primaryText,
  },
  categoryChipTextSelected: {
    color: palette.surface,
    fontSize: 14,
    fontWeight: '600',
  },
  categoryChipTextUnselected: {
    color: palette.chipTextInactive,
    fontSize: 14,
    fontWeight: '600',
  },
  categoryChipUnselected: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
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
  containerContent: {
    backgroundColor: palette.background,
    paddingHorizontal: 24,
    paddingTop: 24,
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
    marginTop: 70,
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
  scrollView: {
    backgroundColor: palette.background,
    flex: 1,
  },
  searchBarContainer: {
    marginBottom: 32,
  },
  searchBarRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  searchButton: {
    alignItems: 'center',
    backgroundColor: palette.primaryText,
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchButtonText: {
    color: palette.surface,
    fontSize: 14,
    fontWeight: '600',
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
    flexDirection: 'row',
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 8,
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
  tagChipSmall: {
    borderRadius: 999,
    marginRight: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
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
    backgroundColor: palette.tagSurface,
  },
  tagChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tagGroup: {
    borderBottomColor: palette.border,
    borderBottomWidth: 1,
    marginBottom: 8,
    paddingBottom: 8,
  },
  tagGroupsContainer: {
    marginBottom: 12,
    marginTop: 12,
  },
});
