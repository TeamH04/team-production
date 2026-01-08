import { palette } from '@/constants/palette';
import { SHOPS, type Shop } from '@team/shop-core';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';

const PAGE_SIZE = 10;
const TAB_BAR_SPACING = 107;

const BUDGET_LABEL: Record<Shop['budget'], string> = {
  $: '¥',
  $$: '¥¥',
  $$$: '¥¥¥',
};

const KEY_EXTRACTOR = (item: Shop) => item.id;

export default function HomeScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{ tag?: string; category?: string }>();
  const activeTag = params.tag;
  const activeCategory = params.category;

  const loadMoreTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 型を正しく指定
  const listRef = useAnimatedRef<FlatList<Shop>>();

  const filteredShops = useMemo(() => {
    if (!activeTag && !activeCategory) {
      return SHOPS;
    }

    return SHOPS.filter(shop => {
      const matchesTag = activeTag ? shop.tags?.includes(activeTag) : true;

      const matchesCategory = activeCategory ? shop.category === activeCategory : true;

      return matchesTag && matchesCategory;
    });
  }, [activeTag, activeCategory]);

  const initialVisibleCount = useMemo(() => {
    if (filteredShops.length === 0) return PAGE_SIZE;
    return Math.min(PAGE_SIZE, filteredShops.length);
  }, [filteredShops.length]);
  const [visibleCount, setVisibleCount] = useState(initialVisibleCount);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  useEffect(() => {
    if (loadMoreTimeout.current) {
      clearTimeout(loadMoreTimeout.current);
      loadMoreTimeout.current = null;
    }

    const resetId = setTimeout(() => {
      setIsLoadingMore(false);
      setVisibleCount(Math.min(PAGE_SIZE, filteredShops.length));

      if (listRef.current) {
        // any を排除して scrollToOffset を呼び出し
        listRef.current.scrollToOffset({ animated: true, offset: 0 });
      }
    }, 0);

    return () => clearTimeout(resetId);
  }, [filteredShops, listRef]);

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
  }, [activeTag, activeCategory, filteredShops.length, router]);

  return (
    <View style={styles.screen}>
      <Animated.FlatList
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>条件に合うお店が見つかりませんでした</Text>
          </View>
        }
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
        ref={listRef}
        renderItem={renderShop}
        showsVerticalScrollIndicator={false}
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
    paddingTop: 80,
  },

  emptyTitle: {
    color: palette.secondaryText,
    fontSize: 16,
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
