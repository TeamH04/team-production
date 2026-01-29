import { Ionicons } from '@expo/vector-icons';
import {
  AUTH_REQUIRED,
  BORDER_RADIUS,
  buildGoogleMapsUrl,
  ERROR_MESSAGES,
  getRatingDisplay,
  RATING_CATEGORIES,
  UI_LABELS,
} from '@team/constants';
import { devWarn, extractErrorMessage } from '@team/core-utils';
import { palette } from '@team/mobile-ui';
import { BUDGET_LABEL } from '@team/shop-core';
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

import { fonts } from '@/constants/typography';
import { useFavorites } from '@/features/favorites/FavoritesContext';
import { useReviews } from '@/features/reviews/ReviewsContext';
import { useStores } from '@/features/stores/StoresContext';
import { useVisited } from '@/features/visited/VisitedContext';
import { ENV } from '@/lib/config';
import { storage } from '@/lib/storage';

import type { ReviewSort } from '@/lib/api';
import type { RatingDetails } from '@team/types';

const SCREEN_WIDTH = Dimensions.get('window').width;

// 評価値に応じたカラーを返す
const getRatingColor = (sentiment: 'satisfied' | 'neutral' | 'dissatisfied') => {
  if (sentiment === 'satisfied') return palette.ratingSatisfied;
  if (sentiment === 'neutral') return palette.ratingNeutral;
  return palette.ratingDissatisfied;
};

type RatingDetailsDisplayProps = {
  ratingDetails: RatingDetails;
};

/**
 * レビューの詳細評価（味、雰囲気、接客など）を表示するコンポーネント
 */
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
          const display = getRatingDisplay(value);
          const color = getRatingColor(display.sentiment);
          return (
            <View key={cat.key} style={ratingStyles.item}>
              <View style={[ratingStyles.iconBadge, { backgroundColor: color + '15' }]}>
                <Ionicons name={display.icon} size={16} color={color} />
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

/**
 * 認証が必要な操作で未認証時にアラートを表示するヘルパー
 */
function showAuthRequiredAlert(router: ReturnType<typeof useRouter>, featureDescription: string) {
  Alert.alert(ERROR_MESSAGES.AUTH_REQUIRED, `${featureDescription}にはログインが必要です。`, [
    { text: UI_LABELS.CANCEL, style: 'cancel' },
    { text: UI_LABELS.LOGIN, onPress: () => router.push('/login') },
  ]);
}

export default function ShopDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const router = useRouter();
  const navigation = useNavigation();

  const { isFavorite, toggleFavorite } = useFavorites();
  const { isVisited, toggleVisited } = useVisited();

  // reviews: 2つ目の設計を採用（ロード・ソート・いいね・ローディング）
  const { getReviews, loadReviews, toggleLike, loadingByShop } = useReviews();

  // store: 2つ目の設計を採用（StoresContextから取得）
  const { getStoreById, loading: storesLoading } = useStores();

  // UI state
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isReviewsOpen, setIsReviewsOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [reviewSort, setReviewSort] = useState<ReviewSort>('new');

  const shop = useMemo(() => (id ? (getStoreById(id) ?? null) : null), [getStoreById, id]);

  const webBaseUrl = ENV.WEB_BASE_URL?.replace(/\/$/, '');
  const reviews = useMemo(() => (shop ? getReviews(shop.id) : []), [shop, getReviews]);
  const isFav = useMemo(() => (shop ? isFavorite(shop.id) : false), [shop, isFavorite]);
  const isVis = useMemo(() => (shop ? isVisited(shop.id) : false), [shop, isVisited]);

  const imageUrls = shop?.imageUrls;
  const flatListRef = useRef<FlatList<string>>(null);

  // 【修正1】isReviewsLoading の定義を追加
  const isReviewsLoading = id ? loadingByShop[id] : false;

  // メニュー：1つ目の「おすすめ2つ」＋アコーディオンUIを採用
  const recommendedMenu = useMemo(() => {
    if (!shop?.menu) return [];
    return shop.menu.slice(0, 2);
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
        height: 50,
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
      loadReviews(id, reviewSort).catch(err => {
        devWarn('Failed to load reviews:', err);
      });
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

  const resolveMenuName = useCallback(
    (review: { menuItemIds?: string[]; menuItemName?: string }) => {
      if (review.menuItemName) return review.menuItemName;
      if (!review.menuItemIds || review.menuItemIds.length === 0 || !shop?.menu) return undefined;

      const names = shop.menu
        .filter(item => review.menuItemIds?.includes(item.id))
        .map(item => item.name);

      return names.length > 0 ? names.join(' / ') : undefined;
    },
    [shop],
  );

  const handleToggleLike = useCallback(
    async (reviewId: string) => {
      if (!shop) return;
      try {
        await toggleLike(shop.id, reviewId);
      } catch (err) {
        const message = extractErrorMessage(err, ERROR_MESSAGES.UNKNOWN);
        if (message === AUTH_REQUIRED) {
          showAuthRequiredAlert(router, 'いいね');
          return;
        }
        Alert.alert('いいねに失敗しました', message);
      }
    },
    [router, shop, toggleLike],
  );

  const handleToggleFavorite = useCallback(async () => {
    if (!shop) return;
    try {
      await toggleFavorite(shop.id);
    } catch (err) {
      const message = extractErrorMessage(err, ERROR_MESSAGES.UNKNOWN);
      if (message === AUTH_REQUIRED) {
        showAuthRequiredAlert(router, 'お気に入り');
        return;
      }
      const isCurrentlyFavorite = isFavorite ? isFavorite(shop.id) : false;
      const title = isCurrentlyFavorite
        ? 'お気に入りの削除に失敗しました'
        : 'お気に入りの追加に失敗しました';
      Alert.alert(title, message);
    }
  }, [router, shop, toggleFavorite, isFavorite]);

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
        {/* Hero: 2つ目の画像カルーセルを採用 */}
        {imageUrls && imageUrls.length > 0 ? (
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
        ) : (
          <View style={styles.heroContainer}>
            <Image source={{ uri: shop.imageUrl }} style={styles.hero} contentFit='cover' />
          </View>
        )}

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
                  size={24}
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
                  size={24}
                  color={isFav ? palette.favoriteActive : palette.muted}
                />
              </Pressable>
            </View>
          </View>

          <Text style={styles.meta}>
            {`${shop.category} │ 予算 ${BUDGET_LABEL[shop.budget]} │ ★ ${shop.rating.toFixed(1)}`}
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
                  router.navigate({ pathname: '/(tabs)', params: { tag } });
                }}
              >
                <Text style={styles.tagText}>{tag}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.descriptionText}>{shop.description}</Text>

          {/* Menu accordion: 1つ目採用 */}
          {shop.menu && shop.menu.length > 0 && (
            <View style={[styles.card, styles.cardShadow, styles.menuSection]}>
              <Pressable style={styles.accordionHeader} onPress={() => setIsAccordionOpen(v => !v)}>
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
                        <View style={styles.recommendedItemLeft}>
                          <Ionicons
                            color={palette.accent}
                            name='star'
                            size={14}
                            style={styles.menuIcon}
                          />
                          <Text style={styles.menuItemText} numberOfLines={1}>
                            {item.name}
                          </Text>
                        </View>
                        <Text style={styles.menuItemPrice}>{item.price}</Text>
                      </View>
                    ))}
                  </View>

                  <Pressable
                    onPress={() => {
                      navigation.setOptions?.({ headerBackTitle: UI_LABELS.BACK });
                      router.push({
                        pathname: '/menu',
                        params: { id: shop.id },
                      });
                    }}
                    style={styles.moreBtnOutline}
                  >
                    <Ionicons color={palette.primary} name='add-circle-outline' size={18} />
                    <Text style={styles.moreBtnText}>もっと見る</Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}

          {/* Map: 1つ目のカードUI + 2つ目の存在チェック */}
          {mapOpenUrl ? (
            <View style={[styles.card, styles.cardShadow, styles.menuSection]}>
              <Pressable style={styles.accordionHeader} onPress={() => setIsMapOpen(v => !v)}>
                <Text style={styles.sectionTitle}>場所</Text>
                <Ionicons
                  color={palette.muted}
                  name={isMapOpen ? 'chevron-up' : 'chevron-down'}
                  size={20}
                />
              </Pressable>

              {isMapOpen && (
                <View style={styles.accordionContent}>
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
                </View>
              )}
            </View>
          ) : null}

          {/* Reviews: 2つ目（sort + like + files + loading）を採用 */}
          <View style={[styles.card, styles.cardShadow, styles.menuSection]}>
            <Pressable style={styles.accordionHeader} onPress={() => setIsReviewsOpen(v => !v)}>
              <Text style={styles.sectionTitle}>レビュー</Text>
              <Ionicons
                color={palette.muted}
                name={isReviewsOpen ? 'chevron-up' : 'chevron-down'}
                size={20}
              />
            </Pressable>

            {isReviewsOpen && (
              <View style={styles.accordionContent}>
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
                    <Text
                      style={[styles.sortText, reviewSort === 'liked' && styles.sortTextActive]}
                    >
                      高評価順
                    </Text>
                  </Pressable>
                </View>

                <Pressable
                  onPress={() => {
                    navigation.setOptions?.({ headerBackTitle: UI_LABELS.BACK });
                    router.push({
                      pathname: '/shop/[id]/review',
                      params: { id: shop.id },
                    });
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
                        <Text style={styles.reviewDate}>
                          {review.createdAt
                            ? new Date(review.createdAt).toLocaleDateString('ja-JP')
                            : ''}
                        </Text>

                        <Pressable
                          onPress={() => handleToggleLike(review.id)}
                          style={[styles.likeButton, review.likedByMe && styles.likeButtonActive]}
                        >
                          <Text
                            style={[styles.likeText, review.likedByMe && styles.likeTextActive]}
                          >
                            いいね {review.likesCount}
                          </Text>
                        </Pressable>
                      </View>

                      {review.ratingDetails && (
                        <RatingDetailsDisplay ratingDetails={review.ratingDetails} />
                      )}

                      {(() => {
                        const menuName = resolveMenuName(review);
                        if (!menuName) return null;
                        return <Text style={styles.reviewMenu}>メニュー: {menuName}</Text>;
                      })()}

                      {review.comment ? (
                        <Text style={styles.reviewBody}>{review.comment}</Text>
                      ) : null}

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
              </View>
            )}
          </View>
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
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  arrowButton: {
    alignItems: 'center',
    backgroundColor: palette.arrowButtonBg,
    borderRadius: 20,
    elevation: 3,
    height: 40,
    justifyContent: 'center',
    position: 'absolute',
    shadowColor: palette.shadow,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    top: '50%',
    transform: [{ translateY: -20 }],
    width: 40,
  },
  arrowButtonLeft: { left: 12 },
  arrowButtonRight: { right: 12 },
  btnPressed: { opacity: 0.85 },
  card: { backgroundColor: palette.white, borderRadius: 16, padding: 16 },
  cardShadow: {
    elevation: 4,
    marginBottom: 16,
    shadowColor: palette.shadow,
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
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
    gap: -4,
    marginRight: -4,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hero: { height: 220, width: SCREEN_WIDTH },
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
    borderRadius: 12,
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
  menuItemPrice: { color: palette.primaryText, fontFamily: fonts.medium, fontSize: 15 },
  menuItemText: {
    color: palette.primaryText,
    flexShrink: 1,
    fontFamily: fonts.medium,
    fontSize: 15,
  },
  menuSection: { marginTop: 8 },
  meta: { color: palette.muted, fontFamily: fonts.regular, marginBottom: 12, marginTop: 4 },
  moreBtnOutline: {
    alignItems: 'center',
    borderColor: palette.primary,
    borderRadius: 12,
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
    borderRadius: 12,
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
    borderRadius: 12,
    marginBottom: 16,
    padding: 12,
  },
  recommendedItem: {
    alignItems: 'center',
    borderBottomColor: palette.divider,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  recommendedItemLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    marginRight: 8,
  },
  recommendedLabel: {
    color: palette.primaryText,
    fontFamily: fonts.medium,
    fontSize: 13,
    marginBottom: 8,
  },
  reviewBody: { color: palette.primaryText, fontFamily: fonts.regular, marginTop: 8 },
  reviewDate: { color: palette.secondaryText, fontFamily: fonts.regular, fontSize: 13 },
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
  reviewImage: { borderRadius: 12, height: 88, marginRight: 10, width: 88 },
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
  },
  titleLoading: { color: palette.secondaryText, fontFamily: fonts.medium, fontSize: 18 },
  visitedBtn: { marginLeft: 8 },
});
