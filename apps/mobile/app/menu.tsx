import { Ionicons } from '@expo/vector-icons';
import { colors as themeColors, withAlpha } from '@team/theme';
import { MENU_TAB_MAP, type ShopMenuItem } from '@team/types';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, SectionList, StyleSheet, Text, View } from 'react-native';

import { useStores } from '@/features/stores/StoresContext';
import { fetchStoreMenus } from '@/lib/api';

// --- 定数 ---
const COLORS = {
  BADGE_BG: withAlpha(themeColors.accent, 0.12),
  BADGE_TEXT: themeColors.accent,
  BLACK: '#000000',
  BORDER_LIGHT: withAlpha(themeColors.primary, 0.12),
  BORDER_MEDIUM: withAlpha(themeColors.primary, 0.2),
  BORDER_SOFT: withAlpha(themeColors.primary, 0.08),

  GRAY_DARK: themeColors.primary,
  GRAY_LIGHT: withAlpha(themeColors.background, 0.9),
  GRAY_MUTED: withAlpha(themeColors.primary, 0.5),
  GRAY_TEXT: withAlpha(themeColors.primary, 0.72),

  HEADER_GREEN: themeColors.secondary,
  IMAGE_BG: withAlpha(themeColors.background, 0.92),
  SUB_TEXT: withAlpha(themeColors.primary, 0.6),

  TAB_BG: '#FFFFFF',
  TAB_BORDER: themeColors.secondary,
  TAB_TEXT: themeColors.secondary,

  TRANSPARENT: 'transparent',

  WHITE: '#FFFFFF',

  TAX_TEXT: withAlpha(themeColors.primary, 0.6),
};

interface ExtendedMenuItem {
  category: string;
  description?: string;
  id: string;
  name: string;
  price: string;
}

export default function ShopMenuScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();

  const { getStoreById } = useStores();

  const [menuItems, setMenuItems] = useState<ExtendedMenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shop = useMemo(() => (id ? (getStoreById(id) ?? null) : null), [getStoreById, id]);

  const mappedCategories = useMemo(() => {
    if (!shop) return [];
    const baseCategories = (MENU_TAB_MAP as Record<string, string[]>)[shop.category] || [];
    return baseCategories;
  }, [shop]);

  const apiCategories = useMemo(() => {
    const categoriesFromMenus = menuItems
      .map(item => item.category?.trim())
      .filter((category): category is string => Boolean(category));
    return Array.from(new Set(categoriesFromMenus));
  }, [menuItems]);

  const hasCategoryTabs = apiCategories.length > 0;

  const categories = useMemo(() => {
    if (!hasCategoryTabs) return ['すべて'];

    const orderedFromMap = mappedCategories.filter(category => apiCategories.includes(category));
    const remainingCategories = apiCategories.filter(
      category => !orderedFromMap.includes(category),
    );

    return ['すべて', 'おすすめ', ...orderedFromMap, ...remainingCategories];
  }, [apiCategories, hasCategoryTabs, mappedCategories]);

  const [selectedCategory, setSelectedCategory] = useState('');

  // Calculate activeCategory directly during render.
  // If selectedCategory is valid and in the list, use it.
  // Otherwise, default to the first category (or empty string).
  const activeCategory =
    selectedCategory && categories.includes(selectedCategory)
      ? selectedCategory
      : categories[0] || '';

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      if (id && (!shop?.menu || shop.menu.length === 0)) {
        setLoading(true);
        setError(null);
        try {
          const menus = await fetchStoreMenus(id);
          if (!active) return;
          const mapped: ExtendedMenuItem[] = menus.map(menu => ({
            id: menu.menu_id,
            name: menu.name,
            category: menu.category?.trim() ?? '',
            price: menu.price != null ? `¥${menu.price.toLocaleString()}` : '---',
            description: menu.description ?? undefined,
          }));
          setMenuItems(mapped);
        } catch (err) {
          if (!active) return;
          const message = err instanceof Error ? err.message : 'メニューの取得に失敗しました';
          setError(message);
        } finally {
          if (active) setLoading(false);
        }
      } else if (shop?.menu && shop.menu.length > 0) {
        const normalized: ExtendedMenuItem[] = shop.menu.map((item: ShopMenuItem) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          price: item.price || '---',
          description: item.description,
        }));
        setMenuItems(normalized);
      }
    };

    void fetchData();

    return () => {
      active = false;
    };
  }, [id, shop]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerStatusBarHeight: 0,
      headerStyle: { backgroundColor: COLORS.HEADER_GREEN, height: 50 },
      headerTintColor: COLORS.WHITE,
      headerTitleAlign: 'center',
      headerTitleStyle: { fontSize: 18, fontWeight: 'bold' },
      title: shop?.name ?? 'メニュー',
    });
  }, [navigation, shop]);

  const sections = useMemo(() => {
    if (!menuItems || menuItems.length === 0) return [];
    const items = menuItems;

    if (activeCategory === 'すべて' || activeCategory === 'おすすめ') {
      const targetItems = activeCategory === 'おすすめ' ? items.slice(0, 2) : items;

      if (targetItems.length === 0) return [];

      const groups = targetItems.reduce(
        (acc, item) => {
          const key = item.category || 'その他';
          if (!acc[key]) acc[key] = [];
          acc[key].push(item);
          return acc;
        },
        {} as Record<string, ExtendedMenuItem[]>,
      );

      return Object.keys(groups).map(category => ({
        data: groups[category],
        title: category,
      }));
    }

    const filtered = items.filter(item => item.category === activeCategory);
    return filtered.length > 0 ? [{ data: filtered, title: activeCategory }] : [];
  }, [menuItems, activeCategory]);

  const renderItem = useCallback(
    ({
      item,
      index,
      section,
    }: {
      item: ExtendedMenuItem;
      index: number;
      section: { title: string };
    }) => {
      const showBadge =
        activeCategory === 'すべて' && index === 0 && item.category === section.title;

      return (
        <View style={styles.menuCard}>
          <View style={styles.cardInner}>
            <View style={styles.menuInfo}>
              <View style={styles.menuHeaderRow}>
                <View style={styles.nameContainer}>
                  <Text numberOfLines={1} style={styles.menuName}>
                    {item.name}
                  </Text>
                  {showBadge && (
                    <View style={styles.recommendBadge}>
                      <Text style={styles.recommendText}>人気</Text>
                    </View>
                  )}
                </View>

                <View style={styles.priceContainer}>
                  <Text style={styles.menuPrice}>{item.price}</Text>
                  <Text style={styles.taxLabel}>(税込)</Text>
                </View>
              </View>

              {(item.category || item.description) && (
                <View style={styles.metaRow}>
                  {item.category &&
                  (activeCategory === 'すべて' || activeCategory === 'おすすめ') ? (
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>{item.category}</Text>
                    </View>
                  ) : null}
                  {item.description ? (
                    <Text numberOfLines={2} style={styles.menuDescription}>
                      {item.description}
                    </Text>
                  ) : null}
                </View>
              )}
            </View>
          </View>
        </View>
      );
    },
    [activeCategory],
  );

  const renderSectionHeader = useCallback(
    ({ section: { title } }: { section: { title: string } }) => {
      if (activeCategory !== 'すべて' && activeCategory !== 'おすすめ') {
        return null;
      }
      return (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
      );
    },
    [activeCategory],
  );

  if (loading) {
    return (
      <View style={styles.screen}>
        <StatusBar style='light' translucent={true} />
        <View style={styles.emptyContainer}>
          <Ionicons color={COLORS.TAX_TEXT} name='restaurant-outline' size={48} />
          <Text style={styles.emptyText}>メニューを読み込み中です...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.screen}>
        <StatusBar style='light' translucent={true} />
        <View style={styles.emptyContainer}>
          <Ionicons color={COLORS.BADGE_TEXT} name='alert-circle' size={48} />
          <Text style={styles.emptyText}>{error}</Text>
        </View>
      </View>
    );
  }

  if (!shop) return null;

  return (
    <View style={styles.screen}>
      <StatusBar style='light' translucent={true} />

      <View style={styles.pageTitleWrapper}>
        <View style={styles.pageTitleCard}>
          <Text style={styles.pageTitle}>メニュー</Text>
          {shop.name ? <Text style={styles.pageSubtitle}>{shop.name}</Text> : null}
          <Text style={styles.pageHint}>提供中のメニューからお選びください</Text>
        </View>
      </View>

      {hasCategoryTabs ? (
        <View style={styles.tabsContainer}>
          <ScrollView
            contentContainerStyle={styles.tabsContent}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {categories.map(category => {
              const isSelected = category === activeCategory;
              return (
                <Pressable
                  key={category}
                  onPress={() => setSelectedCategory(category)}
                  style={[styles.tab, isSelected && styles.tabSelected]}
                >
                  <Text style={[styles.tabText, isSelected && styles.tabTextSelected]}>
                    {category}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      <SectionList
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons color={COLORS.TAX_TEXT} name='restaurant-outline' size={48} />
            <Text style={styles.emptyText}>
              {activeCategory === 'おすすめ'
                ? 'おすすめメニューは現在ありません'
                : `「${activeCategory}」のメニューは準備中です`}
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        sections={sections}
        stickySectionHeadersEnabled={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cardInner: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingVertical: 16,
  },
  categoryBadge: {
    backgroundColor: COLORS.BADGE_BG,
    borderRadius: 12,
    marginRight: 8,
    marginVertical: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryBadgeText: {
    color: COLORS.BADGE_TEXT,
    fontSize: 11,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
    paddingHorizontal: 40,
  },
  emptyText: {
    color: COLORS.TAX_TEXT,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
    textAlign: 'center',
  },
  listContent: {
    backgroundColor: COLORS.WHITE,
    flexGrow: 1,
    paddingBottom: 40,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  menuCard: {
    backgroundColor: COLORS.WHITE,
    borderColor: COLORS.BORDER_SOFT,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    width: '100%',
  },
  menuDescription: {
    color: COLORS.SUB_TEXT,
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  menuHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  menuInfo: {
    flex: 1,
    gap: 6,
    justifyContent: 'center',
  },
  menuName: {
    color: COLORS.GRAY_DARK,
    flexShrink: 1,
    fontSize: 15,
    fontWeight: 'bold',
    marginRight: 6,
  },
  menuPrice: {
    color: COLORS.GRAY_DARK,
    fontSize: 15,
    fontWeight: '700',
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  nameContainer: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
  },
  pageHint: {
    color: COLORS.SUB_TEXT,
    fontSize: 12,
    lineHeight: 18,
  },
  pageSubtitle: {
    color: COLORS.SUB_TEXT,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 20,
  },
  pageTitle: {
    color: COLORS.GRAY_DARK,
    fontSize: 20,
    fontWeight: '800',
  },
  pageTitleCard: {
    backgroundColor: COLORS.WHITE,
    borderColor: COLORS.BORDER_SOFT,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
    padding: 16,
  },
  pageTitleWrapper: { paddingBottom: 4, paddingHorizontal: 4, paddingTop: 6 },
  priceContainer: {
    alignItems: 'baseline',
    flexDirection: 'row',
  },
  recommendBadge: {
    backgroundColor: COLORS.BADGE_BG,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  recommendText: {
    color: COLORS.BADGE_TEXT,
    fontSize: 10,
    fontWeight: 'bold',
  },
  screen: {
    backgroundColor: COLORS.WHITE,
    flex: 1,
  },
  sectionHeader: {
    backgroundColor: COLORS.GRAY_LIGHT,
    borderColor: COLORS.BORDER_LIGHT,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  sectionTitle: {
    color: COLORS.GRAY_TEXT,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  tab: {
    alignItems: 'center',
    backgroundColor: COLORS.TRANSPARENT,
    borderColor: COLORS.WHITE,
    borderRadius: 18,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    marginRight: 8,
    paddingHorizontal: 16,
  },
  tabSelected: {
    backgroundColor: COLORS.WHITE,
    borderColor: COLORS.WHITE,
  },
  tabText: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextSelected: {
    color: COLORS.HEADER_GREEN,
  },
  tabsContainer: {
    backgroundColor: COLORS.HEADER_GREEN,
  },
  tabsContent: {
    flexDirection: 'row',
    paddingBottom: 10,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  taxLabel: {
    color: COLORS.TAX_TEXT,
    fontSize: 9,
    marginLeft: 2,
  },
});
