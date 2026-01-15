import { palette } from '@/constants/palette';
import { TAB_BAR_SPACING } from '@/constants/TabBarSpacing';
import { useFavorites } from '@/features/favorites/FavoritesContext';
import { useStores } from '@/features/stores/StoresContext';
import { Ionicons } from '@expo/vector-icons';
import type { Shop } from '@team/shop-core';
import { withAlpha } from '@team/theme';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Image, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

const BUDGET_LABEL: Record<Shop['budget'], string> = {
  $: '¥',
  $$: '¥¥',
  $$$: '¥¥¥',
};

type SortType = 'newest' | 'rating-high' | 'rating-low';

/**
 * ソート機能のオプション設定
 */
interface SortOption {
  label: string;
  value: SortType;
}

/**
 * ソート方法の選択肢
 */
const SORT_OPTIONS: SortOption[] = [
  { label: '新着順', value: 'newest' },
  { label: '評価が高い順', value: 'rating-high' },
  { label: '評価が低い順', value: 'rating-low' },
];

export default function FavoritesScreen() {
  const router = useRouter();
  const { favorites } = useFavorites();
  const { stores, loading, error } = useStores();
  const [searchText, setSearchText] = useState('');
  const [sortType, setSortType] = useState<SortType>('newest');
  const [showSortModal, setShowSortModal] = useState(false);

  // お気に入りに登録されている店舗のみをフィルタリング
  const favoriteShops = stores.filter(shop => favorites.has(shop.id));

  // 検索とソートを適用
  const filteredAndSortedShops = useMemo(() => {
    let filtered = favoriteShops;

    // 検索フィルタリング
    if (searchText.trim().length > 0) {
      const query = searchText.trim().toLowerCase();
      filtered = filtered.filter(
        shop =>
          shop.name.toLowerCase().includes(query) ||
          shop.description.toLowerCase().includes(query) ||
          shop.category.toLowerCase().includes(query)
      );
    }

    // ソート
    const sorted = [...filtered];
    switch (sortType) {
      case 'rating-high':
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case 'rating-low':
        sorted.sort((a, b) => a.rating - b.rating);
        break;
      case 'newest':
      default:
        sorted.sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime());
        break;
    }

    return sorted;
  }, [searchText, sortType, favoriteShops]);

  const handleShopPress = (shopId: string) => {
    router.push({ pathname: '/shop/[id]', params: { id: shopId } });
  };

  /**
   * ソート方法を変更し、モーダルを閉じる
   * @param value - 選択されたソート方法
   */
  const handleSortSelect = (value: SortType) => {
    setSortType(value);
    setShowSortModal(false);
  };

  /**
   * 現在選択されているソート方法のラベルを取得
   * @returns ソート方法の表示名
   */
  const getCurrentSortLabel = () => {
    const option = SORT_OPTIONS.find(opt => opt.value === sortType);
    return option?.label || '新着順';
  };

  return (
    <View style={styles.container}>
      {/* タイトル */}
      <View style={styles.headerTextBlock}>
        <Text style={styles.screenTitle}>お気に入り</Text>
      </View>

      {/* 検索・ソート操作パネル */}
      <View style={styles.controlPanel}>
        {/* 検索バー */}
        <View style={styles.searchInputContainer}>
          <Ionicons name='search' size={18} color={palette.secondaryText} />
          <TextInput
            style={styles.searchInput}
            placeholder='検索'
            placeholderTextColor={palette.secondaryText}
            value={searchText}
            onChangeText={setSearchText}
            accessibilityLabel='お気に入り検索'
            accessibilityHint='店舗名、説明、カテゴリーで検索'
          />
          {searchText.length > 0 && (
            <Pressable
              onPress={() => setSearchText('')}
              accessibilityLabel='検索を削除'
              accessibilityRole='button'
            >
              <Ionicons name='close' size={18} color={palette.secondaryText} />
            </Pressable>
          )}
        </View>

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
              data={SORT_OPTIONS}
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

      {/* お気に入り一覧 */}
      {loading ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>読み込み中...</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>店舗情報の取得に失敗しました</Text>
        </View>
      ) : filteredAndSortedShops.length > 0 ? (
        <FlatList
          data={filteredAndSortedShops}
          keyExtractor={item => item.id}
          scrollEnabled={true}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Pressable onPress={() => handleShopPress(item.id)} style={styles.shopCard}>
              <Image source={{ uri: item.imageUrl }} style={styles.shopImage} />
              <View style={styles.shopInfo}>
                <View style={styles.shopHeader}>
                  <Text style={styles.shopName}>{item.name}</Text>
                  <View style={styles.ratingBadge}>
                    <Text style={styles.ratingText}>{`★ ${item.rating.toFixed(1)}`}</Text>
                  </View>
                </View>
                <Text style={styles.shopMeta}>
                  {item.category} • 徒歩{item.distanceMinutes}分 • 予算 {BUDGET_LABEL[item.budget]}
                </Text>
                <Text style={styles.shopDescription} numberOfLines={2}>
                  {item.description}
                </Text>
              </View>
            </Pressable>
          )}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>
            {searchText ? '検索結果がありません' : 'お気に入りが登録されていません'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.background,
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  controlPanel: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  emptyTitle: {
    color: palette.secondaryText,
    fontSize: 14,
  },
  headerTextBlock: {
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: TAB_BAR_SPACING,
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: withAlpha('#000000', 0.5),
    flex: 1,
    justifyContent: 'center',
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
  screenTitle: {
    color: palette.primaryText,
    fontSize: 28,
    fontWeight: '700',
  },
  searchInput: {
    color: palette.primaryText,
    flex: 1,
    fontSize: 14,
    marginHorizontal: 8,
  },
  searchInputContainer: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
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
    fontSize: 13,
    fontWeight: '600',
  },
  sortModalContent: {
    backgroundColor: palette.surface,
    borderRadius: 12,
    maxHeight: 200,
    minWidth: 250,
    overflow: 'hidden',
    shadowColor: palette.shadow,
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
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
    fontSize: 14,
    fontWeight: '500',
  },
  sortOptionTextActive: {
    fontWeight: '700',
  },
  sortOptionsFlatList: {
    width: 280,
  },
  sortOptionsList: {
    flexGrow: 0,
  },
});
