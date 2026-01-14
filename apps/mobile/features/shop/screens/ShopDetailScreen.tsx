import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { Href, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { palette } from '@/constants/palette';
import { useFavorites } from '@/features/favorites/FavoritesContext';
import { useReviews } from '@/features/reviews/ReviewsContext';
import { useVisited } from '@/features/visited/VisitedContext';
import { SHOPS, type Shop } from '@team/shop-core';

const COLORS = {
  BLACK: '#000000',
  WHITE: '#FFFFFF',
};

interface ExtendedShop extends Shop {
  menu?: (NonNullable<Shop['menu']>[number] & { isRecommended?: boolean })[];
}

const BUDGET_LABEL: Record<Shop['budget'], string> = {
  $: '¥',
  $$: '¥¥',
  $$$: '¥¥¥',
};

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function ShopDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id;
  const router = useRouter();
  const navigation = useNavigation();

  const { isFavorite, toggleFavorite } = useFavorites();
  const { isVisited, toggleVisited } = useVisited();
  const { getReviews, isReviewLiked, toggleReviewLike } = useReviews();

  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

  const shop = useMemo(() => (SHOPS as ExtendedShop[]).find(s => s.id === id), [id]);

  const webBaseUrl = process.env.EXPO_PUBLIC_WEB_BASE_URL?.replace(/\/$/, '');

  const reviews = useMemo(() => (shop ? getReviews(shop.id) : []), [shop, getReviews]);

  const isFav = useMemo(() => (shop ? isFavorite(shop.id) : false), [shop, isFavorite]);

  const isVis = useMemo(() => (shop ? isVisited(shop.id) : false), [shop, isVisited]);

  const recommendedMenu = useMemo(() => {
    if (!shop?.menu) return [];
    return shop.menu.slice(0, 2);
  }, [shop]);

  useLayoutEffect(() => {
    if (shop) {
      navigation.setOptions?.({
        headerBackTitle: '戻る',
        headerShadowVisible: false,
        headerShown: true,
        headerStatusBarHeight: 0,
        headerStyle: {
          backgroundColor: COLORS.BLACK,
          height: 50,
        },
        headerTintColor: COLORS.WHITE,
        headerTitleAlign: 'center',
        headerTitleStyle: {
          fontSize: 20,
          fontWeight: 'bold',
        },
        title: shop.name,
      });
    }
  }, [navigation, shop]);

  useFocusEffect(
    useCallback(() => {
      navigation.setOptions?.({ headerBackTitle: '戻る' });
    }, [navigation])
  );

  const mapOpenUrl = useMemo(
    () =>
      shop?.placeId
        ? `https://www.google.com/maps/search/?api=1&query_place_id=${shop.placeId}`
        : null,
    [shop]
  );

  const handleShare = useCallback(() => {
    if (!shop || !webBaseUrl) return;
    const url = `${webBaseUrl}/shop/${shop.id}`;
    Share.share({
      message: `${shop.name}\n${shop.description}\n${url}`,
      title: shop.name,
      url,
    }).catch(() => Alert.alert('共有に失敗しました'));
  }, [shop, webBaseUrl]);

  const handleOpenMap = useCallback(() => {
    if (!mapOpenUrl) return;
    Linking.openURL(mapOpenUrl).catch(() => Alert.alert('マップを開けませんでした'));
  }, [mapOpenUrl]);

  if (!shop) return null;

  return (
    <View style={styles.screen}>
      <StatusBar style='light' translucent={true} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroContainer}>
          <Image contentFit='cover' source={{ uri: shop.imageUrl }} style={styles.hero} />
        </View>

        <View style={styles.container}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{shop.name}</Text>
            <View style={styles.headerActions}>
              <Pressable onPress={handleShare} style={styles.shareBtn}>
                <Ionicons color={palette.muted} name='share-outline' size={22} />
              </Pressable>
              <Pressable
                onPress={() => toggleVisited(shop.id)}
                style={({ pressed }) => [styles.visitedBtn, pressed && styles.btnPressed]}
              >
                <Ionicons
                  name={isVis ? 'checkmark-circle' : 'checkmark-circle-outline'}
                  size={24}
                  color={isVis ? palette.visitedActive : palette.muted}
                />
              </Pressable>
              <Pressable
                onPress={() => toggleFavorite(shop.id)}
                style={({ pressed }) => [styles.favBtn, pressed && styles.btnPressed]}
              >
                <Ionicons
                  color={isFav ? palette.favoriteActive : palette.muted}
                  name={isFav ? 'heart' : 'heart-outline'}
                  size={24}
                />
              </Pressable>
            </View>
          </View>

          <Text style={styles.meta}>
            {`${shop.category} │ 予算 ${BUDGET_LABEL[shop.budget]} │ ★ ${shop.rating.toFixed(1)}`}
          </Text>

          <View style={styles.tagRow}>
            {shop.tags?.map(tag => (
              <View key={tag} style={styles.tagPill}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.descriptionText}>{shop.description}</Text>

          {shop.menu && shop.menu.length > 0 && (
            <View style={[styles.card, styles.cardShadow, styles.menuSection]}>
              <Pressable
                style={styles.accordionHeader}
                onPress={() => setIsAccordionOpen(!isAccordionOpen)}
              >
                <Text style={styles.sectionTitle}>メニュー</Text>
                <Ionicons
                  color={palette.muted}
                  name={isAccordionOpen ? 'chevron-up' : 'chevron-down'}
                  size={20}
                />
              </Pressable>
              {isAccordionOpen && (
                <View style={styles.accordionContent}>
                  <View style={styles.recommendedBox}>
                    <Text style={styles.recommendedLabel}>おすすめメニュー</Text>
                    {recommendedMenu.map(item => (
                      <View key={item.id} style={styles.recommendedItem}>
                        <Ionicons
                          color={palette.accent}
                          name='star'
                          size={14}
                          style={styles.menuIcon}
                        />
                        <Text style={styles.menuItemText}>{item.name}</Text>
                      </View>
                    ))}
                  </View>
                  <Pressable
                    onPress={() => router.push(`/shop/${shop.id}/review` as never)}
                    style={styles.moreBtnOutline}
                  >
                    <Ionicons color={palette.primary} name='add-circle-outline' size={18} />
                    <Text style={styles.moreBtnText}>もっとみる</Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>場所</Text>
          </View>
          <View style={[styles.card, styles.cardShadow]}>
            <Pressable onPress={handleOpenMap} style={styles.mapButton}>
              <Ionicons
                color={palette.primary}
                name='map-outline'
                size={18}
                style={styles.mapIcon}
              />
              <Text style={styles.mapButtonText}>Googleマップで確認</Text>
            </Pressable>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>レビュー</Text>
          </View>
          <Pressable
            onPress={() => router.push(`/shop/${shop.id}/review` as Href)}
            style={styles.primaryBtn}
          >
            <Text style={styles.primaryBtnText}>レビューを書く</Text>
          </Pressable>

          {reviews.length === 0 ? (
            <View style={[styles.card, styles.cardShadow]}>
              <Text style={styles.muted}>まだレビューがありません。</Text>
            </View>
          ) : (
            reviews.map(review => {
              const isLiked = isReviewLiked(review.id);
              return (
                <View key={review.id} style={[styles.card, styles.cardShadow]}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewTitle}>★ {review.rating}</Text>
                    <Pressable onPress={() => toggleReviewLike(review.id)}>
                      <Ionicons
                        color={isLiked ? palette.accent : palette.muted}
                        name={isLiked ? 'heart' : 'heart-outline'}
                        size={20}
                      />
                    </Pressable>
                  </View>
                  <Text style={styles.reviewBody}>{review.comment}</Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  accordionContent: { marginTop: 16 },
  accordionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  btnPressed: { opacity: 0.7 },
  card: {
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 16,
  },
  cardShadow: {
    elevation: 4,
    marginBottom: 16,
    shadowColor: palette.shadow,
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  container: { padding: 16 },
  content: {
    backgroundColor: COLORS.WHITE,
    paddingBottom: 24,
  },
  descriptionText: {
    color: palette.primary,
    lineHeight: 22,
    marginBottom: 16,
  },
  favBtn: {
    marginLeft: 8,
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hero: { height: 220, width: SCREEN_WIDTH },
  heroContainer: { backgroundColor: palette.heroPlaceholder },
  mapButton: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  mapButtonText: { color: palette.primary, fontWeight: '700' },
  mapIcon: { marginRight: 8 },
  menuIcon: { marginRight: 10 },
  menuItemText: { color: palette.primary, fontSize: 15, fontWeight: '500' },
  menuSection: { marginTop: 8 },
  meta: { color: palette.muted, marginBottom: 12, marginTop: 4 },
  moreBtnOutline: {
    alignItems: 'center',
    borderColor: palette.primary,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
    paddingVertical: 14,
  },
  moreBtnText: { color: palette.primary, fontWeight: '700' },
  muted: {
    color: palette.muted,
    marginTop: 6,
  },
  primaryBtn: {
    backgroundColor: palette.accent,
    borderRadius: 12,
    marginBottom: 16,
    paddingVertical: 12,
  },
  primaryBtnText: {
    color: palette.primaryOnAccent,
    fontWeight: '700',
    textAlign: 'center',
  },
  recommendedBox: {
    backgroundColor: palette.secondarySurface,
    borderColor: palette.border,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    padding: 12,
  },
  recommendedItem: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingVertical: 6,
  },
  recommendedLabel: {
    color: palette.accent,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
  },
  reviewBody: { color: palette.primary, lineHeight: 20 },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reviewTitle: { color: palette.primary, fontWeight: '700' },
  screen: { backgroundColor: COLORS.BLACK, flex: 1 },
  sectionHeader: { marginBottom: 8, marginTop: 16 },
  sectionTitle: { color: palette.primary, fontSize: 18, fontWeight: '700' },
  shareBtn: { padding: 4 },
  tagPill: {
    backgroundColor: palette.tagSurface,
    borderRadius: 999,
    marginRight: 8,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  tagText: { color: palette.tagText, fontSize: 12, fontWeight: '600' },
  title: { color: palette.primary, fontSize: 22, fontWeight: '800' },
  visitedBtn: { marginLeft: 8 },
});
