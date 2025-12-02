import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FlatList } from 'react-native';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';

import { palette } from '@/constants/palette';
import { CATEGORIES, SHOPS, type Shop, type ShopCategory } from '@/features/home/data/shops';
import { getSupabase } from '@/lib/supabase';

const PAGE_SIZE = 10;
const CATEGORY_ALL = 'すべて';

type CategoryFilter = ShopCategory | typeof CATEGORY_ALL;

const CATEGORY_OPTIONS: CategoryFilter[] = [CATEGORY_ALL, ...[...CATEGORIES].sort()];

const BUDGET_LABEL: Record<Shop['budget'], string> = {
  $: '¥',
  $$: '¥¥',
  $$$: '¥¥¥',
};

const KEY_EXTRACTOR = (item: Shop) => item.id;

export default function HomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<TextInput | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>(CATEGORY_ALL);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listRef = useAnimatedRef<FlatList<Shop>>();

  const normalizedQuery = useMemo(() => searchQuery.trim().toLowerCase(), [searchQuery]);

  const filteredShops = useMemo(() => {
    return SHOPS.filter(shop => {
      const matchesCategory =
        selectedCategory === CATEGORY_ALL || shop.category === selectedCategory;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        shop.name.toLowerCase().includes(normalizedQuery) ||
        shop.tags.some(tag => tag.toLowerCase().includes(normalizedQuery)) ||
        shop.description.toLowerCase().includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [normalizedQuery, selectedCategory]);

  const prevQueryRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    const q = params?.q;
    if (typeof q === 'string' && q.trim().length > 0 && prevQueryRef.current !== q) {
      prevQueryRef.current = q;
      setSearchQuery(q);
      setVisibleCount(PAGE_SIZE);
      // scroll to top when new query applied
      try {
        const listCurrent = (listRef as unknown as { current?: FlatList<Shop> | null }).current;
        listCurrent?.scrollToOffset?.({ offset: 0, animated: true });
      } catch {
        // ignore if not available
      }
    }
  }, [params?.q]);

  useEffect(() => {
    if (loadMoreTimeout.current) {
      clearTimeout(loadMoreTimeout.current);
      loadMoreTimeout.current = null;
    }
    setIsLoadingMore(false);
    setVisibleCount(
      filteredShops.length === 0 ? PAGE_SIZE : Math.min(PAGE_SIZE, filteredShops.length)
    );
  }, [filteredShops.length, normalizedQuery, selectedCategory]);

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

  const handleCategoryPress = useCallback((category: CategoryFilter) => {
    setSelectedCategory(current => (current === category ? CATEGORY_ALL : category));
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await getSupabase().auth.signOut();
      router.replace('/login' as Href);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert('ログアウトに失敗しました', message);
    }
  }, [router]);

  const renderShop = useCallback(
    ({ item }: { item: Shop }) => {
      return (
        <View style={styles.cardShadow}>
          <Pressable
            accessibilityLabel={`${item.name} の詳細へ`}
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
              <View style={styles.tagRow}>
                {item.tags.map(tag => (
                  <Pressable
                    key={tag}
                    style={styles.tagPill}
                    accessibilityLabel={`タグ ${tag} で検索`}
                    onPress={() => {
                      setSearchQuery(tag);
                      setVisibleCount(PAGE_SIZE);
                      // sync route param so behavior matches ShopDetail tag taps
                      router.setParams({ q: tag });
                      try {
                        const listCurrent = (
                          listRef as unknown as { current?: FlatList<Shop> | null }
                        ).current;
                        listCurrent?.scrollToOffset?.({ offset: 0, animated: true });
                      } catch {
                        // ignore
                      }
                      searchInputRef.current?.focus();
                    }}
                  >
                    <Text style={styles.tagText}>{tag}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </Pressable>
        </View>
      );
    },
    [router]
  );

  const renderListHeader = useMemo(
    () => (
      <View style={styles.headerContainer}>
        <View style={styles.logoutRow}>
          <Pressable onPress={handleLogout} hitSlop={8}>
            <Text style={styles.logoutText}>ログアウト</Text>
          </Pressable>
        </View>
        <View style={styles.headerTextBlock}>
          <Text style={styles.screenTitle}>次に通いたくなるお店を見つけよう</Text>
          <Text style={styles.screenSubtitle}>
            気分に合わせてカテゴリやキーワードで、行きつけにしたいスポットを探せます。
          </Text>
        </View>
        <View style={[styles.searchWrapper, styles.shadowLight]}>
          <TextInput
            ref={searchInputRef}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder='お店名・雰囲気・タグで検索'
            placeholderTextColor='#9CA3AF'
            style={styles.searchInput}
            autoCorrect={false}
            autoCapitalize='none'
            clearButtonMode='while-editing'
          />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScrollContent}
          style={styles.categoryScroll}
        >
          {CATEGORY_OPTIONS.map(category => {
            const isSelected = selectedCategory === category;
            return (
              <Pressable
                key={category}
                onPress={() => handleCategoryPress(category)}
                style={[
                  styles.categoryChip,
                  isSelected ? styles.categoryChipSelected : styles.categoryChipUnselected,
                  isSelected ? styles.shadowStrong : styles.shadowLight,
                ]}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    isSelected
                      ? styles.categoryChipTextSelected
                      : styles.categoryChipTextUnselected,
                  ]}
                >
                  {category}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    ),
    [handleCategoryPress, handleLogout, searchQuery, selectedCategory]
  );

  const renderEmptyState = useMemo(
    () => (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>条件に合うお店が見つかりませんでした</Text>
        <Text style={styles.emptySubtitle}>
          キーワードを変えるか、カテゴリを切り替えて別の候補もチェックしてみてください。
        </Text>
      </View>
    ),
    []
  );

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
              <ActivityIndicator color='#0EA5E9' />
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
  categoryChip: {
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  categoryChipSelected: {
    backgroundColor: palette.primaryText,
    borderColor: palette.primaryText,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryChipTextSelected: {
    color: palette.surface,
  },
  categoryChipTextUnselected: {
    color: palette.chipTextInactive,
  },
  categoryChipUnselected: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
  },
  categoryScroll: {
    marginBottom: 4,
  },
  categoryScrollContent: {
    alignItems: 'center',
    paddingRight: 8,
  },
  content: {
    paddingBottom: 32,
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
  headerTextBlock: {
    marginBottom: 16,
  },
  logoutRow: {
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  logoutText: {
    color: palette.link,
    fontSize: 12,
    fontWeight: '500',
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
  screenSubtitle: {
    color: palette.secondaryText,
    fontSize: 16,
    marginTop: 6,
  },
  screenTitle: {
    color: palette.primaryText,
    fontSize: 28,
    fontWeight: '700',
  },
  searchInput: {
    color: palette.primaryText,
    fontSize: 16,
  },
  searchWrapper: {
    backgroundColor: palette.surface,
    borderRadius: 24,
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  shadowLight: {
    elevation: 3,
    shadowColor: palette.shadow,
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  shadowStrong: {
    elevation: 5,
    shadowColor: palette.shadow,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  tagPill: {
    backgroundColor: palette.tagSurface,
    borderRadius: 999,
    marginBottom: 8,
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 14,
  },
  tagText: {
    color: palette.tertiaryText,
    fontSize: 12,
    fontWeight: '600',
  },
});
