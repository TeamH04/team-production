import { Ionicons } from '@expo/vector-icons';
import { ERROR_MESSAGES, FONT_WEIGHT } from '@team/constants';
import { palette } from '@team/mobile-ui';
import { BUDGET_LABEL, type Shop } from '@team/shop-core';
import { withAlpha } from '@team/theme';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ShopCard } from '@/components/ShopCard';
import { FAVORITES_SORT_OPTIONS } from '@/constants/sortOptions';
import { TAB_BAR_SPACING } from '@/constants/TabBarSpacing';
import { useFavorites } from '@/features/favorites/FavoritesContext';
import { useStores } from '@/features/stores/StoresContext';
import { useShopFilter, type SortType } from '@/hooks/useShopFilter';
import { useShopNavigator } from '@/hooks/useShopNavigator';

export default function FavoritesScreen() {
  const { navigateToShop } = useShopNavigator();
  const { favorites, loadFavorites } = useFavorites();
  const { stores, loading, error } = useStores();
  const [searchText, setSearchText] = useState('');
  const [sortType, setSortType] = useState<SortType>('newest');
  const [showSortModal, setShowSortModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void loadFavorites().catch(() => {
        Alert.alert('お気に入りの取得に失敗しました', '通信環境を確認してもう一度お試しください。');
      });
    }, [loadFavorites]),
  );

  // お気に入りに登録されている店舗のみをフィルタリング
  const favoriteShops = stores.filter(shop => favorites.has(shop.id));

  // 検索とソートを適用
  const { filteredShops: filteredAndSortedShops } = useShopFilter({
    shops: favoriteShops,
    searchText,
    sortType,
  });

  const formatFavoritesMeta = useCallback(
    (shop: Shop) =>
      `${shop.category} • 徒歩${shop.distanceMinutes}分 • 予算 ${BUDGET_LABEL[shop.budget]}`,
    [],
  );

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
    const option = FAVORITES_SORT_OPTIONS.find(opt => opt.value === sortType);
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

      {/* お気に入り一覧 */}
      {loading ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>読み込み中...</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>{ERROR_MESSAGES.STORE_FETCH_FAILED}</Text>
        </View>
      ) : filteredAndSortedShops.length > 0 ? (
        <FlatList
          data={filteredAndSortedShops}
          keyExtractor={item => item.id}
          scrollEnabled={true}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <ShopCard shop={item} onPress={navigateToShop} formatMeta={formatFavoritesMeta} />
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
    fontWeight: FONT_WEIGHT.SEMIBOLD,
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
