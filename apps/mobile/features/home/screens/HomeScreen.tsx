import { palette } from '@/constants/palette';
import { TAB_BAR_SPACING } from '@/constants/TabBarSpacing';
import { useStores } from '@/features/stores/StoresContext';
import type { Shop } from '@team/shop-core';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { type ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, type FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';

const PAGE_SIZE = 10;

const BUDGET_LABEL: Record<Shop['budget'], string> = {
  $: '¥',
  $$: '¥¥',
  $$$: '¥¥¥',
};

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
    }, 350);
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
  const { stores, loading, error } = useStores();
  const params = useLocalSearchParams<{
    tag?: string | string[];
    category?: string | string[];
  }>();
  const activeTag = Array.isArray(params.tag) ? params.tag[0] : params.tag;
  const activeCategory = Array.isArray(params.category) ? params.category[0] : params.category;

  const listKey = `${activeTag ?? 'all'}-${activeCategory ?? 'all'}`;

  const filteredShops = useMemo(() => {
    if (!activeTag && !activeCategory) {
      return stores;
    }

    return stores.filter(shop => {
      const matchesTag = activeTag ? shop.tags?.includes(activeTag) : true;
      const matchesCategory = activeCategory ? shop.category === activeCategory : true;

      return matchesTag && matchesCategory;
    });
  }, [activeCategory, activeTag, stores]);

  const renderShop = useCallback(
    ({ item }: { item: Shop }) => (
      <View style={styles.cardShadow}>
        <Pressable
          onPress={() => router.push({ pathname: '/shop/[id]', params: { id: item.id } })}
          style={styles.cardContainer}
        >
          <Image contentFit='cover' source={{ uri: item.imageUrl }} style={styles.cardImage} />

          <View style={styles.cardBody}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingText}>{`★ ${item.rating.toFixed(1)}`}</Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{item.category}</Text>
              <Text style={styles.metaSeparator}>│</Text>
              <Text style={styles.metaText}>{`徒歩${item.distanceMinutes}分`}</Text>
              <Text style={styles.metaSeparator}>│</Text>
              <Text style={styles.metaText}>{`予算 ${BUDGET_LABEL[item.budget]}`}</Text>
            </View>

            <Text style={styles.cardDescription} numberOfLines={2}>
              {item.description}
            </Text>
          </View>
        </Pressable>
      </View>
    ),
    [router]
  );

  const renderListHeader = useMemo(() => {
    if (!activeTag && !activeCategory) return <View style={styles.headerContainer} />;

    return (
      <View style={styles.headerContainer}>
        <View style={styles.filterInfo}>
          <Text style={styles.filterText}>
            {activeTag ? `#${activeTag}` : activeCategory} の結果: {filteredShops.length}件
          </Text>

          <Pressable onPress={() => router.replace('/')}>
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
          <Text style={styles.emptyTitle}>店舗情報の取得に失敗しました</Text>
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
  cardBody: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },

  cardContainer: {
    backgroundColor: palette.surface,
    borderRadius: 28,
    overflow: 'hidden',
  },

  cardDescription: {
    color: palette.tertiaryText,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
  },

  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
  },

  cardImage: {
    height: 176,
    width: '100%',
  },

  cardShadow: {
    elevation: 5,
    marginBottom: 20,
    shadowColor: palette.shadow,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },

  cardTitle: {
    color: palette.primaryText,
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    marginRight: 12,
  },

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
    fontWeight: '600',
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
    fontWeight: '600',
  },

  footerLoader: {
    paddingVertical: 24,
  },

  headerContainer: {
    marginBottom: 24,
  },

  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 12,
  },

  metaSeparator: {
    color: palette.divider,
    fontSize: 13,
    marginHorizontal: 6,
  },

  metaText: {
    color: palette.secondaryText,
    fontSize: 13,
  },

  ratingBadge: {
    backgroundColor: palette.highlight,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  ratingText: {
    color: palette.ratingText,
    fontSize: 13,
    fontWeight: '600',
  },

  screen: {
    backgroundColor: palette.background,
    flex: 1,
  },
});
