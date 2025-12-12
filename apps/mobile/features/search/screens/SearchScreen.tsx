import { palette } from '@/constants/palette';
import { SHOPS, type Shop } from '@team/shop-core';
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
export default function SearchScreen() {
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const [currentSearch, setCurrentSearch] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // 検索結果を店名とタグで分けて分類
  const { shopNameResults, tagResults } = useMemo(() => {
    if (!currentSearch.trim()) {
      return { shopNameResults: [], tagResults: [] };
    }
    const query = currentSearch.trim().toLowerCase();

    const shopNameResults: Shop[] = [];
    const tagResults: Shop[] = [];

    SHOPS.forEach(shop => {
      const matchesName = shop.name.toLowerCase().includes(query);
      const matchesTags = shop.tags.some(tag => tag.toLowerCase().includes(query));
      const matchesDesc = shop.description.toLowerCase().includes(query);
      const matchesCategory = shop.category.toLowerCase().includes(query);
      const matchesMenu = shop.menu?.some(item => item.name.toLowerCase().includes(query)) ?? false;

      if (matchesName) {
        shopNameResults.push(shop);
      } else if (matchesTags || matchesDesc || matchesCategory || matchesMenu) {
        tagResults.push(shop);
      }
    });

    return { shopNameResults, tagResults };
  }, [currentSearch]);

  const handleSearch = (query: string) => {
    const trimmedQuery = query.trim();
    if (trimmedQuery) {
      setCurrentSearch(trimmedQuery);
      // 新しい検索をhistoryの先頭に追加（重複は削除）
      const filtered = searchHistory.filter(h => h !== trimmedQuery);
      setSearchHistory([trimmedQuery, ...filtered]);
    } else {
      // 空欄の場合は検索結果をクリア
      setCurrentSearch('');
    }
  };

  const handleRemoveHistory = (item: string) => {
    setSearchHistory(searchHistory.filter(h => h !== item));
  };

  const handleShopPress = (shopId: string) => {
    router.push({ pathname: '/shop/[id]', params: { id: shopId } });
  };

  return (
    <View style={styles.container}>
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
              onChangeText={setSearchText}
              onSubmitEditing={() => handleSearch(searchText)}
            />
            <Pressable
              onPress={() => {
                setSearchText('');
                setCurrentSearch('');
              }}
              style={[styles.clearButton, !searchText && styles.clearButtonHidden]}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </Pressable>
          </View>
          <Pressable onPress={() => handleSearch(searchText)} style={styles.searchButton}>
            <Text style={styles.searchButtonText}>検索する</Text>
          </Pressable>
        </View>
      </View>

      {/* 検索結果の表示 */}
      {currentSearch && (
        <View style={styles.resultsSection}>
          <Text style={styles.resultsTitle}>
            「{currentSearch}」の検索結果：{shopNameResults.length + tagResults.length}件
          </Text>

          {shopNameResults.length > 0 || tagResults.length > 0 ? (
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* 店名で見つけたもの */}
              {shopNameResults.length > 0 && (
                <View style={styles.categorySection}>
                  <Text style={styles.categoryTitle}>店名で見つかったお店</Text>
                  {shopNameResults.map(item => (
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
              )}

              {/* タグで見つけたもの */}
              {tagResults.length > 0 && (
                <View style={styles.categorySection}>
                  <Text style={styles.categoryTitle}>タグ・説明で見つかったお店</Text>
                  {tagResults.map(item => (
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
              )}
            </ScrollView>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>条件に合うお店が見つかりませんでした</Text>
            </View>
          )}
        </View>
      )}

      {/* 検索履歴 */}
      {!currentSearch && (
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>検索履歴</Text>
          {searchHistory.length > 0 ? (
            <FlatList
              data={searchHistory}
              keyExtractor={(item, index) => `${item}-${index}`}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.historyItem}>
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
            <Text style={styles.emptyHistoryText}>まだ検索履歴がありません</Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    color: palette.primaryText,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
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
  resultsSection: {
    flex: 1,
  },
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
});
