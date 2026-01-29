import {
  BORDER_RADIUS,
  ERROR_MESSAGES,
  LAYOUT,
  MOBILE_PAGE_SIZE,
  RATING_CATEGORIES,
  ROUTES,
  TIMING,
} from '@team/constants';
import { useShopFilter } from '@team/hooks';
import { palette } from '@team/mobile-ui';
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
import { fonts } from '@/constants/typography';
import { useStores } from '@/features/stores/StoresContext';
import { useShopNavigator } from '@/hooks/useShopNavigator';

// ページネーション設定
const PAGE_SIZE = MOBILE_PAGE_SIZE;
// ブースト対象の店舗数（一覧上部に優先的に表示する店舗数）
// 現在は上位3店舗をブーストする仕様
const BOOST_COUNT = 3;

// おすすめカテゴリ（評価カテゴリのラベルをインデックスに応じて循環表示）
const FEATURED_CATEGORIES = RATING_CATEGORIES.map(c => c.label);

const KEY_EXTRACTOR = (item: Shop) => item.id;

type ShopResultsListProps = {
  emptyState: ReactElement;
  filteredShops: Shop[];
  renderListHeader: ReactElement;
  renderShop: ({ item, index }: { item: Shop; index: number }) => ReactElement;
};

function ShopResultsList({
  emptyState,
  filteredShops,
  renderListHeader,
  renderShop,
}: ShopResultsListProps) {
  const [visibleCount, setVisibleCount] = useState(() => Math.min(PAGE_SIZE, filteredShops.length));
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listRef = useAnimatedRef<FlatList<Shop>>();

  useEffect(() => {
    if (loadMoreTimeout.current) {
      clearTimeout(loadMoreTimeout.current);
      loadMoreTimeout.current = null;
    }

    const resetId = setTimeout(() => {
      setIsLoadingMore(false);
      setVisibleCount(Math.min(PAGE_SIZE, filteredShops.length));
    }, 0);

    return () => clearTimeout(resetId);
  }, [filteredShops]);

  useEffect(() => {
    return () => {
      if (loadMoreTimeout.current) {
        clearTimeout(loadMoreTimeout.current);
        loadMoreTimeout.current = null;
      }
    };
  }, []);

  const visibleShops = useMemo(() => {
    return filteredShops.slice(0, visibleCount);
  }, [filteredShops, visibleCount]);

  const hasMoreResults = visibleCount < filteredShops.length;

  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || !hasMoreResults) return;

    setIsLoadingMore(true);

    loadMoreTimeout.current = setTimeout(() => {
      setVisibleCount(prev => Math.min(prev + PAGE_SIZE, filteredShops.length));
      setIsLoadingMore(false);
      loadMoreTimeout.current = null;
    }, TIMING.LOAD_MORE_DELAY);
  }, [filteredShops.length, hasMoreResults, isLoadingMore]);

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

  // useShopFilter フックによるフィルタリング
  const { filteredShops } = useShopFilter({
    shops: stores,
    searchText: '',
    categories: activeCategory ? [activeCategory] : [],
    tags: activeTag ? [activeTag] : [],
    sortType: 'default',
  });

  // ブースト対象のショップIDを計算（スコアリングで上位N件を選出）
  const boostedShopIds = useMemo(() => {
    const scored = filteredShops.map(shop => {
      // TODO: 実際のスコアリングロジックに置き換える
      const score = shop.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return { id: shop.id, score };
    });

    return new Set(
      scored
        .sort((a, b) => b.score - a.score)
        .slice(0, BOOST_COUNT)
        .map(entry => entry.id),
    );
  }, [filteredShops]);

  const renderShop = useCallback(
    ({ item, index }: { item: Shop; index: number }) => (
      <ShopCard
        shop={item}
        onPress={navigateToShop}
        variant='large'
        isBoosted={boostedShopIds.has(item.id)}
        featuredCategory={FEATURED_CATEGORIES[index % FEATURED_CATEGORIES.length]}
      />
    ),
    [boostedShopIds, navigateToShop],
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
    fontFamily: fonts.medium,
    fontSize: 14,
  },

  content: {
    paddingBottom: LAYOUT.TAB_BAR_SPACING,
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
    fontFamily: fonts.regular,
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },

  emptyTitle: {
    color: palette.secondaryText,
    fontFamily: fonts.medium,
    fontSize: 16,
  },

  filterInfo: {
    alignItems: 'center',
    backgroundColor: palette.secondarySurface,
    borderRadius: BORDER_RADIUS.MEDIUM,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
  },

  filterText: {
    color: palette.primaryText,
    fontFamily: fonts.medium,
    fontSize: 14,
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
