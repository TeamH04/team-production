import { palette } from '@/constants/palette';
import { TAB_BAR_SPACING } from '@/constants/TabBarSpacing';
import { useStores } from '@/features/stores/StoresContext';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FlatList } from 'react-native';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import type { Shop } from '@team/shop-core';

const PAGE_SIZE = 10;
// Categories removed from Home screen; use Search screen for category/tag browsing

const BUDGET_LABEL: Record<Shop['budget'], string> = {
  $: '¥',
  $$: '¥¥',
  $$$: '¥¥¥',
};

const KEY_EXTRACTOR = (item: Shop) => item.id;

export default function HomeScreen() {
  const router = useRouter();
  // category selection removed
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const { stores, loading, error } = useStores();
  const loadMoreTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listRef = useAnimatedRef<FlatList<Shop>>();

  const filteredShops = useMemo(() => stores, [stores]);

  useEffect(() => {
    if (loadMoreTimeout.current) {
      clearTimeout(loadMoreTimeout.current);
      loadMoreTimeout.current = null;
    }
    const newVisibleCount =
      filteredShops.length === 0 ? PAGE_SIZE : Math.min(PAGE_SIZE, filteredShops.length);

    queueMicrotask(() => {
      setIsLoadingMore(false);
      setVisibleCount(newVisibleCount);
    });
  }, [filteredShops.length]);

  useEffect(() => {
    return () => {
      if (loadMoreTimeout.current) {
        clearTimeout(loadMoreTimeout.current);
      }
    };
  }, []);

  const visibleShops = useMemo(() => {
    if (filteredShops.length === 0) {
      return [];
    }
    return filteredShops.slice(0, Math.min(visibleCount, filteredShops.length));
  }, [filteredShops, visibleCount]);

  const hasMoreResults = visibleCount < filteredShops.length;

  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || !hasMoreResults) {
      return;
    }
    if (loadMoreTimeout.current) {
      clearTimeout(loadMoreTimeout.current);
    }
    setIsLoadingMore(true);
    loadMoreTimeout.current = setTimeout(() => {
      setVisibleCount(prev => Math.min(prev + PAGE_SIZE, filteredShops.length));
      setIsLoadingMore(false);
      loadMoreTimeout.current = null;
    }, 350);
  }, [filteredShops.length, hasMoreResults, isLoadingMore]);

  const renderShop = useCallback(
    ({ item }: { item: Shop }) => {
      return (
        <View style={styles.cardShadow}>
          <Pressable
            accessibilityLabel={`${item.name}の詳細を開く`}
            onPress={() => router.push({ pathname: '/shop/[id]', params: { id: item.id } })}
            style={styles.cardContainer}
          >
            <Image source={{ uri: item.imageUrl }} style={styles.cardImage} contentFit='cover' />
            <View style={styles.cardBody}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.name}</Text>
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
              <Text style={styles.cardDescription}>{item.description}</Text>
              {/* Tags removed from Home screen — use Search screen for tag browsing */}
            </View>
          </Pressable>
        </View>
      );
    },
    [router]
  );

  const renderListHeader = useMemo(() => <View style={styles.headerContainer}></View>, []);

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
      <Animated.FlatList
        ref={listRef}
        data={visibleShops}
        keyExtractor={KEY_EXTRACTOR}
        renderItem={renderShop}
        contentContainerStyle={styles.content}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={
          isLoadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator color={palette.accent} />
            </View>
          ) : null
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.2}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps='handled'
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

  content: {
    paddingBottom: TAB_BAR_SPACING,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 80,
  },
  emptySubtitle: {
    color: palette.secondaryText,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyTitle: {
    color: palette.primaryText,
    fontSize: 18,
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
    flexWrap: 'wrap',
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
