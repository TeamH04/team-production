import { Ionicons } from '@expo/vector-icons';
import { BUDGET_LABEL } from '@team/shop-core';
import { Image } from 'expo-image';
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

import { palette } from '@/constants/palette';
import { TAB_BAR_SPACING } from '@/constants/TabBarSpacing';
import { fonts } from '@/constants/typography';
import { useStores } from '@/features/stores/StoresContext';

import type { Shop } from '@team/shop-core';

const PAGE_SIZE = 10;
const FEATURED_REACTIONS = ['味', '接客', '雰囲気', '提供速度', '価格'];
const BOOST_COUNT = 3;
const CATEGORY_LABELS: Record<string, string> = {
  'スイーツ・デザート専門': 'スイーツ',
  'ファストフード・テイクアウト': 'ファストフード',
};

const normalizeCategoryLabel = (category?: string) => {
  if (!category) return category;

  if (category.includes('スイーツ・デザート')) return 'スイーツ';
  if (category.includes('ファストフード')) return 'ファストフード';
  if (category.includes('ビュッフェ・食べ放題')) return '食べ放題';
  if (category.includes('・')) return category.split('・')[0];

  return CATEGORY_LABELS[category] ?? category;
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

  const boostedShopIds = useMemo(() => {
    const scored = filteredShops.map(shop => {
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

  const orderedShops = useMemo(() => {
    const boosted = filteredShops.filter(shop => boostedShopIds.has(shop.id));
    const nonBoosted = filteredShops.filter(shop => !boostedShopIds.has(shop.id));
    const result: Shop[] = [];
    const maxLen = Math.max(boosted.length, nonBoosted.length);

    for (let i = 0; i < maxLen; i++) {
      if (i < boosted.length) {
        result.push(boosted[i]);
      }
      if (i < nonBoosted.length) {
        result.push(nonBoosted[i]);
      }
    }

    return result;
  }, [boostedShopIds, filteredShops]);

  const renderShop = useCallback(
    ({ item }: { item: Shop }) => {
      const isBoosted = boostedShopIds.has(item.id);
      const reactionIndex =
        item.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) %
        FEATURED_REACTIONS.length;
      const reactionLabel = FEATURED_REACTIONS[reactionIndex];
      const categoryLabel = normalizeCategoryLabel(item.category) ?? item.category;

      return (
        <View style={styles.cardShadow}>
          <Pressable
            onPress={() => router.push({ pathname: '/shop/[id]', params: { id: item.id } })}
            style={[styles.cardContainer, isBoosted && styles.cardContainerBoosted]}
          >
            {isBoosted ? (
              <View style={styles.boostBadge}>
                <Ionicons name='flame' size={16} color={palette.boostRed} />
              </View>
            ) : null}
            <Image contentFit='cover' source={{ uri: item.imageUrl }} style={styles.cardImage} />

            <View style={styles.cardBody}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.name}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaText}>{categoryLabel}</Text>
                <Text style={styles.metaSeparator}>│</Text>
                <Text style={styles.metaText}>{`徒歩${item.distanceMinutes}分`}</Text>
                <Text style={styles.metaSeparator}>│</Text>
                <Text style={styles.metaText}>{`予算 ${BUDGET_LABEL[item.budget]}`}</Text>
                <Text style={styles.metaSeparator}>│</Text>
                <View style={styles.metaBadge}>
                  <Text style={styles.metaBadgeText}>{reactionLabel}</Text>
                  <Ionicons name='thumbs-up' size={12} color={palette.metaBadgeText} />
                </View>
              </View>

              <Text style={styles.cardDescription} numberOfLines={2}>
                {item.description}
              </Text>
            </View>
          </Pressable>
        </View>
      );
    },
    [boostedShopIds, router],
  );

  const renderListHeader = useMemo(() => {
    if (!activeTag && !activeCategory) return <View style={styles.headerContainer} />;

    return (
      <View style={styles.headerContainer}>
        <View style={styles.filterInfo}>
          <Text style={styles.filterText}>
            {activeTag
              ? `#${activeTag}`
              : (normalizeCategoryLabel(activeCategory) ?? activeCategory)}{' '}
            の結果: {filteredShops.length}件
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
        filteredShops={orderedShops}
        renderListHeader={renderListHeader}
        renderShop={renderShop}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  boostBadge: {
    alignItems: 'center',
    backgroundColor: palette.boostBadgeBg,
    borderRadius: 999,
    justifyContent: 'center',
    padding: 8,
    position: 'absolute',
    right: 12,
    top: 12,
    zIndex: 1,
  },

  cardBody: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },

  cardContainer: {
    backgroundColor: palette.surface,
    borderColor: palette.divider,
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },

  cardContainerBoosted: {
    borderColor: palette.boostBorder,
    borderWidth: 2,
  },

  cardDescription: {
    color: palette.tertiaryText,
    fontFamily: fonts.regular,
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
    fontFamily: fonts.medium,
    fontSize: 18,
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

  metaBadge: {
    alignItems: 'center',
    backgroundColor: palette.metaBadgeBg,
    borderColor: palette.metaBadgeBorder,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  metaBadgeText: {
    color: palette.metaBadgeText,
    fontSize: 13,
    fontWeight: '700',
    marginRight: 6,
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
    fontFamily: fonts.regular,
    fontSize: 13,
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
