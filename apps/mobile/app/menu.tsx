import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useLayoutEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, SectionList, StyleSheet, Text, View } from 'react-native';

import { MENU_TAB_MAP, SHOPS, type Shop } from '@team/shop-core';

// --- 定数 ---
const COLORS = {
  BADGE_BG: '#FFF0F0',
  BADGE_TEXT: '#FF4D4D',
  BLACK: '#000000',
  BORDER_LIGHT: '#EEEEEE',
  BORDER_MEDIUM: 'rgba(255,255,255,0.2)',
  BORDER_SOFT: '#F8F8F8',
  GRAY_DARK: '#333333',
  GRAY_LIGHT: '#F9F9F9',
  GRAY_MUTED: '#AAAAAA',
  GRAY_TEXT: '#666666',
  HEADER_GREEN: '#5B6B5A',
  IMAGE_BG: '#F5F5F5',
  SUB_TEXT: '#777777',
  TAB_BG: 'rgba(255,255,255,0.15)',
  TAB_BORDER: 'rgba(255,255,255,0.25)',
  TAB_TEXT: 'rgba(255,255,255,0.8)',
  TAX_TEXT: '#999999',
  WHITE: '#FFFFFF',
};

interface ExtendedMenuItem {
  category: string;
  description?: string;
  id: string;
  imageUrl?: string;
  name: string;
  price: string;
}

export default function ShopMenuScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();

  const shop = useMemo(() => (SHOPS as Shop[]).find(s => s.id === id), [id]);

  const categories = useMemo(() => {
    if (!shop) return [];
    const baseCategories = (MENU_TAB_MAP as Record<string, string[]>)[shop.category] || [];
    return ['すべて', 'おすすめ', ...baseCategories];
  }, [shop]);

  const [selectedCategory, setSelectedCategory] = useState('');
  const activeCategory = selectedCategory || categories[0] || '';

  useLayoutEffect(() => {
    navigation.setOptions({
      headerStatusBarHeight: 0,
      headerStyle: { backgroundColor: COLORS.HEADER_GREEN, height: 50 },
      headerTintColor: COLORS.WHITE,
      headerTitleAlign: 'center',
      headerTitleStyle: { fontSize: 18, fontWeight: 'bold' },
      title: 'メニュー',
    });
  }, [navigation, shop]);

  const sections = useMemo(() => {
    if (!shop?.menu) return [];
    const menuItems = shop.menu as unknown as ExtendedMenuItem[];

    if (activeCategory === 'すべて' || activeCategory === 'おすすめ') {
      const targetItems = activeCategory === 'おすすめ' ? menuItems.slice(0, 2) : menuItems;

      if (targetItems.length === 0) return [];

      const groups = targetItems.reduce(
        (acc, item) => {
          if (!acc[item.category]) acc[item.category] = [];
          acc[item.category].push(item);
          return acc;
        },
        {} as Record<string, ExtendedMenuItem[]>
      );

      return Object.keys(groups).map(category => ({
        data: groups[category],
        title: category,
      }));
    }

    const filtered = menuItems.filter(item => item.category === activeCategory);
    return filtered.length > 0 ? [{ data: filtered, title: activeCategory }] : [];
  }, [shop, activeCategory]);

  if (!shop) return null;

  return (
    <View style={styles.screen}>
      <StatusBar style='light' translucent={true} />

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
        renderItem={({ item, index }) => {
          const showBadge =
            activeCategory === 'すべて' && index === 0 && item.category === sections[0]?.title;

          return (
            <View style={styles.menuCard}>
              <View style={styles.cardInner}>
                {item.imageUrl && (
                  <Image
                    contentFit='cover'
                    source={{ uri: item.imageUrl }}
                    style={styles.menuImage}
                  />
                )}

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

                  {item.description && (
                    <Text numberOfLines={2} style={styles.menuDescription}>
                      {item.description}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          );
        }}
        renderSectionHeader={({ section: { title } }) => {
          if (activeCategory !== 'すべて' && activeCategory !== 'おすすめ') {
            return null;
          }
          return (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{title}</Text>
            </View>
          );
        }}
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
  },
  menuCard: {
    borderBottomColor: COLORS.BORDER_SOFT,
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    width: '100%',
  },
  menuDescription: {
    color: COLORS.SUB_TEXT,
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
  menuImage: {
    backgroundColor: COLORS.IMAGE_BG,
    borderRadius: 6,
    height: 64,
    marginRight: 12,
    width: 64,
  },
  menuInfo: {
    flex: 1,
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
  nameContainer: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
  },
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
    borderBottomColor: COLORS.BORDER_LIGHT,
    borderBottomWidth: 1,
    paddingHorizontal: 16,
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
    backgroundColor: COLORS.TAB_BG,
    borderColor: COLORS.TAB_BORDER,
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
    color: COLORS.TAB_TEXT,
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
