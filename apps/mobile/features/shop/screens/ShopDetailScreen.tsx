import { Ionicons } from '@expo/vector-icons';
import {
  AUTH_ERROR_MESSAGES,
  BORDER_RADIUS,
  buildGoogleMapsUrl,
  FONT_WEIGHT,
  formatRating,
  ICON_SIZE,
  LAYOUT,
  RECOMMENDED_MENU_COUNT,
  ROUTES,
  SHADOW_STYLES,
  UI_LABELS,
} from '@team/constants';
import { formatDateJa } from '@team/core-utils';
import { useAuthErrorHandler } from '@team/hooks';
import { palette, showAuthRequiredAlert } from '@team/mobile-ui';
import { BUDGET_LABEL, getShopImages, resolveMenuName } from '@team/shop-core';
import { Image } from 'expo-image';
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Accordion } from '@/components/Accordion';
import { fonts } from '@/constants/typography';
import { useFavorites } from '@/features/favorites/FavoritesContext';
import { useReviews } from '@/features/reviews/ReviewsContext';
import { useStores } from '@/features/stores/StoresContext';
import { useVisited } from '@/features/visited/VisitedContext';
import { ENV } from '@/lib/config';
import { storage } from '@/lib/storage';

import type { RatingDetails } from '@/features/reviews/ReviewsContext';
import type { ReviewSort } from '@/lib/api';

const RATING_CATEGORIES = [
  { key: 'taste', label: '味', icon: 'restaurant-outline' as const },
  { key: 'atmosphere', label: '雰囲気', icon: 'cafe-outline' as const },
  { key: 'service', label: '接客', icon: 'people-outline' as const },
  { key: 'speed', label: '提供速度', icon: 'time-outline' as const },
  { key: 'cleanliness', label: '清潔感', icon: 'sparkles-outline' as const },
] as const;

const getRatingEmoji = (value: number) => {
  if (value === 3) return { icon: 'happy' as const, color: palette.errorText, label: '満足' };
  if (value === 2) return { icon: 'remove' as const, color: palette.accent, label: '普通' };
  return { icon: 'sad' as const, color: palette.primary, label: '不満' };
};

type RatingDetailsDisplayProps = {
  ratingDetails: RatingDetails;
};

function RatingDetailsDisplay({ ratingDetails }: RatingDetailsDisplayProps) {
  const hasAnyRating = RATING_CATEGORIES.some(cat => {
    const value = ratingDetails[cat.key as keyof RatingDetails];
    return value !== null && value !== undefined && value > 0;
  });

  if (!hasAnyRating) return null;

  return (
    <View style={ratingStyles.container}>
      <View style={ratingStyles.grid}>
        {RATING_CATEGORIES.map(cat => {
          const value = ratingDetails[cat.key as keyof RatingDetails];
          if (value === null || value === undefined || value === 0) return null;
          const emoji = getRatingEmoji(value);
          return (
            <View key={cat.key} style={ratingStyles.item}>
              <View style={[ratingStyles.iconBadge, { backgroundColor: emoji.color + '15' }]}>
                <Ionicons name={emoji.icon} size={16} color={emoji.color} />
              </View>
              <Text style={ratingStyles.label}>{cat.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const ratingStyles = StyleSheet.create({
  container: {
    marginBottom: 4,
    marginTop: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  iconBadge: {
    alignItems: 'center',
    borderRadius: 11,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  item: {
    alignItems: 'center',
    backgroundColor: palette.grayLight,
    borderRadius: 16,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  label: {
    color: palette.primaryText,
    fontFamily: fonts.medium,
    fontSize: 12,
  },
});

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function ShopDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const router = useRouter();
  const navigation = useNavigation();

  const { isFavorite, toggleFavorite } = useFavorites();
  const { isVisited, toggleVisited } = useVisited();
  const { handleError } = useAuthErrorHandler();

  // reviews: 2つ目の設計を採用（ロード・ソート・いいね・ローディング）
  const { getReviews, loadReviews, toggleLike, loadingByShop } = useReviews();

  // store: 2つ目の設計を採用（StoresContextから取得）
  const { getStoreById, loading: storesLoading } = useStores();

  // UI state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [reviewSort, setReviewSort] = useState<ReviewSort>('new');

  const shop = useMemo(() => (id ? (getStoreById(id) ?? null) : null), [getStoreById, id]);

  const webBaseUrl = ENV.WEB_BASE_URL?.replace(/\/$/, '');
  const reviews = useMemo(() => (shop ? getReviews(shop.id) : []), [shop, getReviews]);
  const isFav = useMemo(() => (shop ? isFavorite(shop.id) : false), [shop, isFavorite]);
  const isVis = useMemo(() => (shop ? isVisited(shop.id) : false), [shop, isVisited]);

  const imageUrls = useMemo(() => (shop ? getShopImages(shop) : []), [shop]);
  const flatListRef = useRef<FlatList<string>>(null);

  // 【修正1】isReviewsLoading の定義を追加
  const isReviewsLoading = id ? loadingByShop[id] : false;

  // メニュー：1つ目の「おすすめ2つ」＋アコーディオンUIを採用
  const recommendedMenu = useMemo(() => {
    if (!shop?.menu) return [];
    return shop.menu.slice(0, RECOMMENDED_MENU_COUNT);
  }, [shop]);

  // Header: 1つ目の黒系を採用（見た目が締まる）
  useLayoutEffect(() => {
    if (!shop) return;
    navigation.setOptions?.({
      headerBackTitle: UI_LABELS.BACK,
      headerShadowVisible: false,
      headerShown: true,
      headerStatusBarHeight: 0,
      headerStyle: {
        backgroundColor: palette.accent,
        height: LAYOUT.HEADER_HEIGHT,
      },
      headerTintColor: palette.textOnAccent,
      headerTitleAlign: 'center',
      headerTitleStyle: {
        color: palette.textOnAccent,
        fontSize: 20,
        fontWeight: 'bold',
      },
      title: shop.name,
    });
  }, [navigation, shop]);

  useFocusEffect(
    useCallback(() => {
      navigation.setOptions?.({ headerBackTitle: UI_LABELS.BACK });
    }, [navigation]),
  );

  // Reviews load: 2つ目の挙動（focus時にload、sort変化でも再fetch）
  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      loadReviews(id, reviewSort).catch(() => undefined);
    }, [id, loadReviews, reviewSort]),
  );

  const mapOpenUrl = useMemo(() => {
    if (!shop?.placeId) return null;
    return buildGoogleMapsUrl(shop.placeId, shop.name);
  }, [shop]);

  const scrollToImage = useCallback((index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
  }, []);

  const handleShare = useCallback(() => {
    if (!shop) return;

    if (!webBaseUrl) {
      Alert.alert(
        '共有できません',
        '共有URLの設定が見つからないため、この機能は現在利用できません。',
      );
      return;
    }

    const url = `${webBaseUrl}/shop/${shop.id}`;
    Share.share({
      message: `${shop.name}\n${shop.description}\n${url}`,
      title: shop.name,
      url,
    }).catch(() => {
      Alert.alert('共有に失敗しました', 'もう一度お試しください。');
    });
  }, [shop, webBaseUrl]);

  const handleOpenMap = useCallback(() => {
    if (!mapOpenUrl) return;
    Linking.openURL(mapOpenUrl).catch(() => Alert.alert('マップを開けませんでした'));
  }, [mapOpenUrl]);

  const getMenuName = useCallback(
    (review: { menuItemIds?: string[]; menuItemName?: string }) => resolveMenuName(shop, review),
    [shop],
  );

  const handleToggleLike = useCallback(
    async (reviewId: string) => {
      if (!shop) return;
      try {
        await toggleLike(shop.id, reviewId);
      } catch (err) {
        const errorMessage = handleError(err, {
          onAuthRequired: () => {
            showAuthRequiredAlert(AUTH_ERROR_MESSAGES.LIKE, () => router.push('/login'));
          },
        });
        if (errorMessage) {
          Alert.alert('いいねに失敗しました', errorMessage);
        }
      }
    },
    [handleError, router, shop, toggleLike],
  );

  const handleToggleFavorite = useCallback(async () => {
    if (!shop) return;
    try {
      await toggleFavorite(shop.id);
    } catch (err) {
      const errorMessage = handleError(err, {
        onAuthRequired: () => {
          showAuthRequiredAlert(AUTH_ERROR_MESSAGES.FAVORITE, () => router.push('/login'));
        },
      });
      if (errorMessage) {
        const isCurrentlyFavorite = isFavorite ? isFavorite(shop.id) : false;
        const title = isCurrentlyFavorite
          ? 'お気に入りの削除に失敗しました'
          : 'お気に入りの追加に失敗しました';
        Alert.alert(title, errorMessage);
      }
    }
  }, [handleError, isFavorite, router, shop, toggleFavorite]);

  if (storesLoading) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <Text style={styles.titleLoading}>店舗情報を読み込み中...</Text>
      </View>
    );
  }

  if (!shop) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <Text style={styles.titleLoading}>店舗が見つかりませんでした</Text>
        <Pressable style={styles.secondaryBtn} onPress={() => router.back()}>
          <Text style={styles.secondaryBtnText}>{UI_LABELS.BACK}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar style='light' translucent />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero: 画像カルーセル（getShopImages で常に最低1枚を保証） */}
        <View style={styles.heroContainer}>
          <FlatList
            ref={flatListRef}
            data={imageUrls}
            renderItem={({ item, index }) => (
              <Image
                source={{ uri: item }}
                style={styles.hero}
                contentFit='cover'
                accessibilityLabel={`${shop.name} image ${index + 1} of ${imageUrls.length}`}
              />
            )}
            keyExtractor={(_, index) => index.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={event => {
              const x = event.nativeEvent.contentOffset.x;
              setCurrentImageIndex(Math.round(x / SCREEN_WIDTH));
            }}
          />

          {imageUrls.length > 1 && (
            <>
              {currentImageIndex > 0 && (
                <Pressable
                  style={[styles.arrowButton, styles.arrowButtonLeft]}
                  onPress={() => scrollToImage(currentImageIndex - 1)}
                  accessibilityLabel='前の画像'
                >
                  <Ionicons name='chevron-back' size={22} color={palette.primaryText} />
                </Pressable>
              )}
              {currentImageIndex < imageUrls.length - 1 && (
                <Pressable
                  style={[styles.arrowButton, styles.arrowButtonRight]}
                  onPress={() => scrollToImage(currentImageIndex + 1)}
                  accessibilityLabel='次の画像'
                >
                  <Ionicons name='chevron-forward' size={22} color={palette.primaryText} />
                </Pressable>
              )}

              <View style={styles.paginationContainer}>
                {imageUrls.map((uri, idx) => (
                  <View
                    key={uri}
                    style={[
                      styles.paginationDot,
                      idx === currentImageIndex && styles.paginationDotActive,
                    ]}
                  />
                ))}
              </View>
            </>
          )}
        </View>

        <View style={styles.container}>
          {/* Title + actions: 両方の良いとこ（押した時のopacity/disabled等は2つ目寄り） */}
          <View style={styles.headerRow}>
            <Text numberOfLines={1} style={styles.title}>
              {shop.name}
            </Text>
            <View style={styles.headerActions}>
              <Pressable
                accessibilityLabel='このお店を共有'
                onPress={handleShare}
                disabled={!webBaseUrl}
                style={({ pressed }) => [
                  styles.shareBtn,
                  pressed && styles.btnPressed,
                  !webBaseUrl && styles.shareBtnDisabled,
                ]}
              >
                <Ionicons name='share-outline' size={22} color={palette.muted} />
              </Pressable>

              <Pressable
                accessibilityLabel='訪問済み切り替え'
                onPress={() => toggleVisited(shop.id)}
                style={({ pressed }) => [styles.visitedBtn, pressed && styles.btnPressed]}
              >
                <Ionicons
                  name={isVis ? 'checkmark-circle' : 'checkmark-circle-outline'}
                  size={ICON_SIZE.LG}
                  color={isVis ? palette.visitedActive : palette.muted}
                />
              </Pressable>

              <Pressable
                accessibilityLabel='お気に入り切り替え'
                onPress={handleToggleFavorite}
                style={({ pressed }) => [styles.favBtn, pressed && styles.btnPressed]}
              >
                <Ionicons
                  name={isFav ? 'heart' : 'heart-outline'}
                  size={ICON_SIZE.LG}
                  color={isFav ? palette.favoriteActive : palette.muted}
                />
              </Pressable>
            </View>
          </View>

          <Text style={styles.meta}>
            {`${shop.category} │ 予算 ${BUDGET_LABEL[shop.budget]} │ ★ ${formatRating(shop.rating)}`}
          </Text>

          {/* tags: 1つ目の素朴表示 + 2つ目の「タグで検索」導線を採用 */}
          <View style={styles.tagRow}>
            {shop.tags?.map(tag => (
              <Pressable
                key={tag}
                style={styles.tagPill}
                accessibilityLabel={`タグ ${tag} で検索`}
                onPress={() => {
                  navigation.setOptions?.({ headerBackTitle: UI_LABELS.BACK });
                  router.navigate({ pathname: ROUTES.TABS, params: { tag } });
                }}
              >
                <Text style={styles.tagText}>{tag}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.descriptionText}>{shop.description}</Text>

          {/* Menu accordion */}
          {shop.menu && shop.menu.length > 0 && (
            <Accordion
              title='メニュー'
              titleColor={palette.primary}
              iconColor={palette.muted}
              containerStyle={[styles.card, styles.cardShadow, styles.menuSection]}
              headerStyle={styles.accordionHeader}
              titleStyle={styles.sectionTitle}
              contentStyle={styles.accordionContent}
            >
              <View style={styles.recommendedBox}>
                <Text style={styles.recommendedLabel}>{UI_LABELS.RECOMMENDED_MENU}</Text>
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
                onPress={() => {
                  navigation.setOptions?.({ headerBackTitle: UI_LABELS.BACK });
                  router.push({
                    pathname: ROUTES.MENU,
                    params: { id: shop.id },
                  });
                }}
                style={styles.moreBtnOutline}
              >
                <Ionicons color={palette.primary} name='add-circle-outline' size={18} />
                <Text style={styles.moreBtnText}>もっと見る</Text>
              </Pressable>
            </Accordion>
          )}

          {/* Map accordion */}
          {mapOpenUrl ? (
            <Accordion
              title='場所'
              titleColor={palette.primary}
              iconColor={palette.muted}
              containerStyle={[styles.card, styles.cardShadow, styles.menuSection]}
              headerStyle={styles.accordionHeader}
              titleStyle={styles.sectionTitle}
              contentStyle={styles.accordionContent}
            >
              <View style={styles.menuAddressBlock}>
                <Text style={styles.menuAddressLabel}>住所</Text>
                <Text style={styles.menuAddressText}>
                  {shop.address?.trim() ? shop.address : '住所情報がありません'}
                </Text>
              </View>
              <Pressable onPress={handleOpenMap} style={styles.moreBtnOutline}>
                <Ionicons
                  color={palette.primary}
                  name='map-outline'
                  size={18}
                  style={styles.mapIcon}
                />
                <Text style={styles.moreBtnText}>Googleマップで確認</Text>
              </Pressable>
            </Accordion>
          ) : null}

          {/* Reviews accordion */}
          <Accordion
            title='レビュー'
            titleColor={palette.primary}
            iconColor={palette.muted}
            containerStyle={[styles.card, styles.cardShadow, styles.menuSection]}
            headerStyle={styles.accordionHeader}
            titleStyle={styles.sectionTitle}
            contentStyle={styles.accordionContent}
          >
            <View style={styles.reviewIntro}>
              <Text style={styles.reviewSub}>みんなの感想や体験談</Text>
            </View>

            <View style={[styles.sortRow, styles.reviewSortRow]}>
              <Pressable
                onPress={() => setReviewSort('new')}
                style={[styles.sortPill, reviewSort === 'new' && styles.sortPillActive]}
              >
                <Text style={[styles.sortText, reviewSort === 'new' && styles.sortTextActive]}>
                  新しい順
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setReviewSort('liked')}
                style={[styles.sortPill, reviewSort === 'liked' && styles.sortPillActive]}
              >
                <Text style={[styles.sortText, reviewSort === 'liked' && styles.sortTextActive]}>
                  高評価順
                </Text>
              </Pressable>
            </View>

            <Pressable
              onPress={() => {
                navigation.setOptions?.({ headerBackTitle: UI_LABELS.BACK });
                router.push(ROUTES.REVIEW(shop.id));
              }}
              style={[styles.primaryBtn, styles.reviewPrimaryBtn]}
            >
              <Text style={styles.primaryBtnText}>レビューを書く</Text>
            </Pressable>

            <View style={styles.reviewDivider} />

            {isReviewsLoading ? (
              <View style={[styles.card, styles.cardShadow]}>
                <Text style={styles.muted}>レビューを読み込み中...</Text>
              </View>
            ) : reviews.length === 0 ? (
              <View style={[styles.card, styles.cardShadow]}>
                <Text style={styles.muted}>
                  まだレビューがありません。最初のレビューを投稿しましょう！
                </Text>
              </View>
            ) : (
              reviews.map(review => (
                <View key={review.id} style={[styles.card, styles.cardShadow]}>
                  <View style={styles.reviewHeaderRow}>
                    <Text style={styles.reviewTitle}>
                      ★ {review.rating}
                      {' ・ '}
                      {review.createdAt ? formatDateJa(review.createdAt) : ''}
                    </Text>

                    <Pressable
                      onPress={() => handleToggleLike(review.id)}
                      style={[styles.likeButton, review.likedByMe && styles.likeButtonActive]}
                    >
                      <Text style={[styles.likeText, review.likedByMe && styles.likeTextActive]}>
                        いいね {review.likesCount}
                      </Text>
                    </Pressable>
                  </View>

                  {(() => {
                    const menuName = getMenuName(review);
                    if (!menuName) return null;
                    return <Text style={styles.reviewMenu}>メニュー: {menuName}</Text>;
                  })()}

                  {review.comment ? <Text style={styles.reviewBody}>{review.comment}</Text> : null}

                  {review.files && review.files.length > 0 && (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.reviewFiles}
                    >
                      {review.files.map(file => {
                        const url = file.url ?? storage.buildStorageUrl(file.objectKey);
                        if (!url) return null;
                        return (
                          <Image
                            key={file.id}
                            source={{ uri: url }}
                            style={styles.reviewImage}
                            contentFit='cover'
                          />
                        );
                      })}
                    </ScrollView>
                  )}
                </View>
              ))
            )}
          </Accordion>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  accordionContent: { marginTop: 16 },
  accordionHeader: {
    alignItems: 'center',
    backgroundColor: palette.white,
    borderRadius: BORDER_RADIUS.MEDIUM,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  arrowButton: {
    alignItems: 'center',
    backgroundColor: palette.arrowButtonBg,
    borderRadius: 20,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)',
    elevation: 3,
    height: 40,
    justifyContent: 'center',
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -20 }],
    width: 40,
  },
  arrowButtonLeft: { left: 12 },
  arrowButtonRight: { right: 12 },
  btnPressed: { opacity: 0.85 },
  card: { backgroundColor: palette.white, borderRadius: 16, padding: 16 },
  cardShadow: {
    ...SHADOW_STYLES.CARD,
    marginBottom: 16,
  },
  centered: { alignItems: 'center', justifyContent: 'center' },
  container: { padding: 16 },
  content: {
    backgroundColor: palette.background,
    paddingBottom: 24,
  },
  descriptionText: {
    color: palette.primary,
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 16,
  },
  favBtn: { padding: 2 },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: -4, // ここを極限まで狭めました
    marginRight: -4,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hero: { height: LAYOUT.HERO_IMAGE_HEIGHT, width: SCREEN_WIDTH },
  heroContainer: {
    backgroundColor: palette.heroPlaceholder,
    position: 'relative',
  },
  likeButton: {
    backgroundColor: palette.highlight,
    borderColor: palette.accent,
    borderRadius: BORDER_RADIUS.PILL,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  likeButtonActive: {
    backgroundColor: palette.highlight,
    borderColor: palette.accent,
  },
  likeText: { color: palette.muted, fontFamily: fonts.medium, fontSize: 12 },
  likeTextActive: { color: palette.accent },
  mapIcon: { marginRight: 8 },
  menuAddressBlock: {
    backgroundColor: palette.grayLight,
    borderRadius: BORDER_RADIUS.MEDIUM,
    marginBottom: 12,
    padding: 12,
  },
  menuAddressLabel: { color: palette.secondaryText, fontFamily: fonts.medium, fontSize: 12 },
  menuAddressText: {
    color: palette.primaryText,
    fontFamily: fonts.medium,
    fontSize: 14,
    marginTop: 6,
  },
  menuIcon: { marginRight: 10 },
  menuItemText: { color: palette.primaryText, fontFamily: fonts.medium, fontSize: 15 },
  menuSection: { marginTop: 8 },
  meta: { color: palette.muted, fontFamily: fonts.regular, marginBottom: 12, marginTop: 4 },
  moreBtnOutline: {
    alignItems: 'center',
    borderColor: palette.primary,
    borderRadius: BORDER_RADIUS.MEDIUM,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 14,
  },
  moreBtnText: { color: palette.primary, fontFamily: fonts.medium, fontSize: 15 },
  muted: { color: palette.muted, fontFamily: fonts.regular, marginTop: 6 },
  paginationContainer: {
    bottom: 12,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  paginationDot: {
    backgroundColor: palette.muted,
    borderRadius: 3,
    height: 6,
    opacity: 0.5,
    width: 6,
  },
  paginationDotActive: { backgroundColor: palette.primaryOnAccent, opacity: 1 },
  primaryBtn: {
    backgroundColor: palette.accent,
    borderRadius: BORDER_RADIUS.MEDIUM,
    marginBottom: 16,
    paddingVertical: 12,
  },
  primaryBtnText: {
    color: palette.primaryOnAccent,
    fontFamily: fonts.medium,
    textAlign: 'center',
  },
  recommendedBox: {
    backgroundColor: palette.grayLight,
    borderRadius: BORDER_RADIUS.MEDIUM,
    marginBottom: 16,
    padding: 12,
  },
  recommendedItem: {
    alignItems: 'center',
    borderBottomColor: palette.divider,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingVertical: 8,
  },
  recommendedLabel: {
    color: palette.primaryText,
    fontFamily: fonts.medium,
    fontSize: 13,
    marginBottom: 8,
  },
  reviewBody: { color: palette.primaryText, fontFamily: fonts.regular, marginTop: 8 },
  reviewDivider: {
    borderBottomColor: palette.divider,
    borderBottomWidth: 1,
    marginBottom: 12,
    marginTop: 4,
  },
  reviewFiles: { marginTop: 12 },
  reviewHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reviewImage: {
    borderRadius: BORDER_RADIUS.MEDIUM,
    height: LAYOUT.REVIEW_IMAGE_SIZE,
    marginRight: 10,
    width: LAYOUT.REVIEW_IMAGE_SIZE,
  },
  reviewIntro: { marginBottom: 8 },
  reviewMenu: { color: palette.muted, fontFamily: fonts.regular, marginTop: 6 },
  reviewPrimaryBtn: { marginBottom: 12, marginTop: 4 },
  reviewSortRow: { marginBottom: 12 },
  reviewSub: {
    color: palette.secondaryText,
    fontFamily: fonts.regular,
    fontSize: 13,
    marginTop: 2,
  },
  reviewTitle: { color: palette.primary, fontFamily: fonts.medium },
  screen: { backgroundColor: palette.background, flex: 1 },
  secondaryBtn: {
    backgroundColor: palette.secondarySurface,
    borderColor: palette.border,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  secondaryBtnText: { color: palette.textOnSecondary, fontFamily: fonts.medium },
  sectionTitle: { color: palette.primary, fontFamily: fonts.medium, fontSize: 18 },
  shareBtn: { marginLeft: 8, padding: 4 },
  shareBtnDisabled: { opacity: 0.4 },
  sortPill: {
    backgroundColor: palette.secondarySurface,
    borderColor: palette.border,
    borderRadius: BORDER_RADIUS.PILL,
    borderWidth: 1,
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sortPillActive: {
    backgroundColor: palette.accent,
    borderColor: palette.accent,
  },
  sortRow: { flexDirection: 'row', marginBottom: 8 },
  sortText: { color: palette.muted, fontFamily: fonts.medium, fontSize: 12 },
  sortTextActive: { color: palette.primaryOnAccent },
  tagPill: {
    backgroundColor: palette.tagSurface,
    borderRadius: BORDER_RADIUS.PILL,
    marginRight: 8,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  tagText: { color: palette.tagText, fontFamily: fonts.medium, fontSize: 12 },
  title: {
    color: palette.primary,
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 22,
    marginRight: 0,
  },
  titleLoading: { color: palette.secondaryText, fontFamily: fonts.medium, fontSize: 18 },
  visitedBtn: { marginLeft: 8 },
});
