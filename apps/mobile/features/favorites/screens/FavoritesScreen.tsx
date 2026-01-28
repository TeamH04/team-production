import { Ionicons } from '@expo/vector-icons';
import { ERROR_MESSAGES, FAVORITES_SORT_OPTIONS, LAYOUT } from '@team/constants';
import { useShopFilter } from '@team/hooks';
import { palette } from '@team/mobile-ui';
import { formatShopMeta } from '@team/shop-core';
import { withAlpha } from '@team/theme';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ShopCard } from '@/components/ShopCard';
import { fonts } from '@/constants/typography';
import { useFavorites } from '@/features/favorites/FavoritesContext';
import { useStores } from '@/features/stores/StoresContext';
import { useShopNavigator } from '@/hooks/useShopNavigator';

import type { SortType } from '@team/types';

const SortOptionSeparator = () => <View style={styles.sortOptionSeparator} />;

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
  const favoriteShops = useMemo(
    () => stores.filter(shop => favorites.has(shop.id)),
    [stores, favorites],
  );

  // 検索とソートを適用
  const { filteredShops: filteredAndSortedShops } = useShopFilter({
    shops: favoriteShops,
    searchText,
    sortType,
  });

  /**
   * ソート方法を変更し、モーダルを閉じる
   * @param value - 選択されたソート方法
   */
  const handleSortSelect = (value: SortType) => {
    setSortType(value);
    setShowSortModal(false);
  };

  /**
   * 現在選択されているソート方法のラベル
   */
  const currentSortLabel = useMemo(() => {
    const option = FAVORITES_SORT_OPTIONS.find(opt => opt.value === sortType);
    return option?.label || '新着順';
  }, [sortType]);

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
          accessibilityHint={`現在のソート：${currentSortLabel}`}
          accessibilityRole='button'
        >
          <Ionicons name='funnel' size={18} color={palette.primaryText} />
          <Text style={styles.sortButtonText}>{currentSortLabel}</Text>
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
              ItemSeparatorComponent={SortOptionSeparator}
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
            <ShopCard shop={item} onPress={navigateToShop} formatMeta={formatShopMeta} />
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
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  headerTextBlock: {
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: LAYOUT.TAB_BAR_SPACING,
  },
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: withAlpha('#000000', 0.5),
    flex: 1,
    justifyContent: 'center',
  },
  screenTitle: {
    color: palette.primaryText,
    fontFamily: fonts.medium,
    fontSize: 28,
  },
  searchInput: {
    color: palette.primaryText,
    flex: 1,
    fontFamily: fonts.regular,
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
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  sortModalContent: {
    backgroundColor: palette.surface,
    borderRadius: 12,
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
    maxHeight: 200,
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
});
