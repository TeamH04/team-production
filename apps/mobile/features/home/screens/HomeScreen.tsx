import { ERROR_MESSAGES, FONT_WEIGHT, MOBILE_PAGE_SIZE, ROUTES } from '@team/constants';
import { usePagination } from '@team/hooks';
import { type Shop } from '@team/shop-core';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { type ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  type FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';

import { ShopCard } from '@/components/ShopCard';
import { palette } from '@/constants/palette';
import { TAB_BAR_SPACING } from '@/constants/TabBarSpacing';
import { useStores } from '@/features/stores/StoresContext';
import { useShopFilter } from '@/hooks/useShopFilter';
import { useShopNavigator } from '@/hooks/useShopNavigator';

const KEY_EXTRACTOR = (item: Shop) => item.id;

type ShopResultsListProps = {
  emptyState: ReactElement;
  filteredShops: Shop[];
  renderListHeader: ReactElement;
  renderShop: ({ item }: { item: Shop }) => ReactElement;
};

function ShopResultsList({
  emptyState,
  filteredShops,
  renderListHeader,
  renderShop,
}: ShopResultsListProps) {
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listRef = useAnimatedRef<FlatList<Shop>>();

  const {
    visibleItems: visibleShops,
    hasMore: hasMoreResults,
    loadMore,
    reset: resetPagination,
  } = usePagination(filteredShops, { pageSize: MOBILE_PAGE_SIZE });

  useEffect(() => {
    if (loadMoreTimeout.current) {
      clearTimeout(loadMoreTimeout.current);
      loadMoreTimeout.current = null;
    }

    const resetId = setTimeout(() => {
      setIsLoadingMore(false);
      resetPagination();
    }, 0);

    return () => clearTimeout(resetId);
  }, [filteredShops, resetPagination]);

  useEffect(() => {
    return () => {
      if (loadMoreTimeout.current) {
        clearTimeout(loadMoreTimeout.current);
        loadMoreTimeout.current = null;
      }
    };
  }, []);

  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || !hasMoreResults) return;

    setIsLoadingMore(true);

    loadMoreTimeout.current = setTimeout(() => {
      loadMore();
      setIsLoadingMore(false);
      loadMoreTimeout.current = null;
    }, 350);
  }, [hasMoreResults, isLoadingMore, loadMore]);

  return (
    <Animated.FlatList
      ref={listRef}
      ListEmptyComponent={emptyState}
      ListFooterComponent={
        isLoadingMore ? (
          <View style={styles.footerLoader}>
            <ActivityIndicator color={palette.accent} />
          </View>
        ) : null
      }
      ListHeaderComponent={renderListHeader}
      contentContainerStyle={styles.content}
      data={visibleShops}
      keyExtractor={KEY_EXTRACTOR}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.2}
      renderItem={renderShop}
      showsVerticalScrollIndicator={false}
    />
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { navigateToShop } = useShopNavigator();
  const { stores, loading, error } = useStores();
  const params = useLocalSearchParams<{
    tag?: string | string[];
    category?: string | string[];
  }>();
  const activeTag = Array.isArray(params.tag) ? params.tag[0] : params.tag;
  const activeCategory = Array.isArray(params.category) ? params.category[0] : params.category;

  const listKey = `${activeTag ?? 'all'}-${activeCategory ?? 'all'}`;

  const { filteredShops } = useShopFilter({
    shops: stores,
    searchText: '',
    categories: activeCategory ? [activeCategory] : [],
    tags: activeTag ? [activeTag] : [],
    sortType: 'default',
  });

  const renderShop = useCallback(
    ({ item }: { item: Shop }) => <ShopCard shop={item} onPress={navigateToShop} variant='large' />,
    [navigateToShop],
  );

  const renderListHeader = useMemo(() => {
    if (!activeTag && !activeCategory) return <View style={styles.headerContainer} />;

    return (
      <View style={styles.headerContainer}>
        <View style={styles.filterInfo}>
          <Text style={styles.filterText}>
            {activeTag ? `#${activeTag}` : activeCategory} の結果: {filteredShops.length}件
          </Text>

          <Pressable onPress={() => router.replace(ROUTES.HOME)}>
            <Text style={styles.clearFilterText}>解除</Text>
          </Pressable>
        </View>
      </View>
    );
  }, [activeCategory, activeTag, filteredShops.length, router]);

  const renderEmptyState = useMemo(() => {
    if (loading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator color={palette.accent} />
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>{ERROR_MESSAGES.STORE_FETCH_FAILED}</Text>
          <Text style={styles.emptySubtitle}>{error}</Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>条件に合うお店が見つかりませんでした</Text>
        <Text style={styles.emptySubtitle}>
          キーワードを変えるか、カテゴリを切り替えて別の候補もチェックしてみてください。
        </Text>
      </View>
    );
  }, [error, loading]);

  return (
    <View style={styles.screen}>
      <ShopResultsList
        key={listKey}
        emptyState={renderEmptyState}
        filteredShops={filteredShops}
        renderListHeader={renderListHeader}
        renderShop={renderShop}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  clearFilterText: {
    color: palette.accent,
    fontSize: 14,
    fontWeight: '700',
  },

  content: {
    paddingBottom: TAB_BAR_SPACING,
    paddingHorizontal: 24,
    paddingTop: 24,
  },

  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 80,
  },

  emptySubtitle: {
    color: palette.secondaryText,
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },

  emptyTitle: {
    color: palette.secondaryText,
    fontSize: 16,
    fontWeight: FONT_WEIGHT.SEMIBOLD,
  },

  filterInfo: {
    alignItems: 'center',
    backgroundColor: palette.secondarySurface,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
  },

  filterText: {
    color: palette.primaryText,
    fontSize: 14,
    fontWeight: FONT_WEIGHT.SEMIBOLD,
  },

  footerLoader: {
    paddingVertical: 24,
  },

  headerContainer: {
    marginBottom: 24,
  },

  screen: {
    backgroundColor: Platform.select({
      android: palette.backgroundAndroid,
      ios: palette.background,
      default: palette.background,
    }),
    flex: 1,
  },
});
