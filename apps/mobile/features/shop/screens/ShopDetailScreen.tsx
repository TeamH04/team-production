import { palette } from '@/constants/palette';
import { useFavorites } from '@/features/favorites/FavoritesContext';
import { useReviews } from '@/features/reviews/ReviewsContext';
import { useStores } from '@/features/stores/StoresContext';
import { useVisited } from '@/features/visited/VisitedContext';
import type { ReviewSort } from '@/lib/api';
import { getPublicStorageUrl } from '@/lib/storage';
import { Ionicons } from '@expo/vector-icons';
import type { Shop } from '@team/shop-core';
import { Image } from 'expo-image';
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
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

const BUDGET_LABEL: Record<Shop['budget'], string> = {
  $: '¥',
  $$: '¥¥',
  $$$: '¥¥¥',
};

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function ShopDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const navigation = useNavigation();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isVisited, toggleVisited } = useVisited();
  const { getReviews, loadReviews, toggleLike, loadingByShop } = useReviews();
  const { getStoreById, loading: storesLoading } = useStores();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [reviewSort, setReviewSort] = useState<ReviewSort>('new');
  const shop = useMemo(() => (id ? (getStoreById(id) ?? null) : null), [getStoreById, id]);

  const webBaseUrl = process.env.EXPO_PUBLIC_WEB_BASE_URL?.replace(/\/$/, '');

  useLayoutEffect(() => {
    if (shop) {
      navigation.setOptions?.({
        title: shop.name,
        headerBackTitle: '戻る',
        headerStyle: { backgroundColor: palette.accent },
        headerTintColor: palette.primaryOnAccent,
      });
    }
  }, [navigation, shop]);

  useFocusEffect(
    useCallback(() => {
      navigation.setOptions?.({ headerBackTitle: '戻る' });
    }, [navigation])
  );

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      loadReviews(id, reviewSort).catch(err => {
        console.warn('Failed to load reviews', err);
      });
    }, [id, loadReviews, reviewSort])
  );

  const isFav = id ? isFavorite(id) : false;
  const isVis = id ? isVisited(id) : false;
  const reviews = id ? getReviews(id) : [];
  const isReviewsLoading = id ? loadingByShop[id] : false;
  const imageUrls = shop?.imageUrls;
  const flatListRef = useRef<FlatList>(null);
  const mapOpenUrl = useMemo(
    () =>
      shop?.placeId
        ? `https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${shop.placeId}`
        : null,
    [shop?.placeId]
  );

  const resolveMenuName = useCallback(
    (review: { menuItemIds?: string[]; menuItemName?: string }) => {
      if (review.menuItemName) {
        return review.menuItemName;
      }
      if (!review.menuItemIds || review.menuItemIds.length === 0 || !shop?.menu) {
        return undefined;
      }
      const names = shop.menu
        .filter(item => review.menuItemIds?.includes(item.id))
        .map(item => item.name);
      return names.length > 0 ? names.join(' / ') : undefined;
    },
    [shop]
  );

  const handleToggleLike = useCallback(
    async (reviewId: string) => {
      if (!shop) return;
      try {
        await toggleLike(shop.id, reviewId);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        if (message === 'auth_required') {
          Alert.alert('ログインが必要です', 'いいねにはログインが必要です。', [
            { text: 'キャンセル', style: 'cancel' },
            { text: 'ログイン', onPress: () => router.push('/login') },
          ]);
          return;
        }
        Alert.alert('いいねに失敗しました', message);
      }
    },
    [router, shop, toggleLike]
  );

  const scrollToImage = (index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
  };

  const handleShare = useCallback(() => {
    if (!shop) return;

    if (!webBaseUrl) {
      Alert.alert(
        '共有できません',
        '共有URLの設定が見つからないため、この機能は現在利用できません。'
      );
      return;
    }

    const url = `${webBaseUrl}/shop/${shop.id}`;

    Share.share({
      message: `${shop.name}\n${shop.description}\n${url}`,
      url,
      title: shop.name,
    }).catch(err => {
      console.warn('Failed to share shop', err);
      Alert.alert('共有に失敗しました', 'もう一度お試しください。');
    });
  }, [shop, webBaseUrl]);

  if (storesLoading) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <Text style={styles.title}>店舗情報を読み込み中...</Text>
      </View>
    );
  }

  if (!shop) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <Text style={styles.title}>店舗が見つかりませんでした</Text>
        <Pressable style={styles.secondaryBtn} onPress={() => router.back()}>
          <Text style={styles.secondaryBtnText}>戻る</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
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
            scrollEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={event => {
              const contentOffsetX = event.nativeEvent.contentOffset.x;
              const currentIndex = Math.round(contentOffsetX / SCREEN_WIDTH);
              setCurrentImageIndex(currentIndex);
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
        <Image source={{ uri: shop.imageUrl }} style={styles.hero} contentFit='cover' />
      )}

      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{shop.name}</Text>

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
              onPress={() => toggleFavorite(shop.id)}
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

        <Text
          style={styles.meta}
        >{`${shop.category} │ 徒歩${shop.distanceMinutes}分 │ 予算 ${BUDGET_LABEL[shop.budget]} │ ★ ${shop.rating.toFixed(1)}`}</Text>

        <Text style={styles.description}>{shop.description}</Text>

        <View style={styles.tagRow}>
          {shop.tags.map(tag => (
            <Pressable
              key={tag}
              style={styles.tagPill}
              accessibilityLabel={`タグ ${tag} で検索`}
              onPress={() => {
                navigation.setOptions?.({ headerBackTitle: '戻る' });
                router.navigate({ pathname: '/(tabs)', params: { tag } });
              }}
            >
              <Text style={styles.tagText}>{tag}</Text>
            </Pressable>
          ))}
        </View>

        {mapOpenUrl ? (
          <View style={[styles.card, styles.cardShadow, styles.mapCard]}>
            <Text style={styles.sectionTitle}>場所</Text>
            <Pressable
              style={styles.mapButton}
              onPress={() => mapOpenUrl && Linking.openURL(mapOpenUrl)}
              accessibilityLabel={`${shop.name} の場所をマップで開く`}
            >
              <Text style={styles.mapButtonText}>マップで開く</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>レビュー</Text>
          <Text style={styles.sectionSub}>みんなの感想や体験談</Text>
        </View>

        <View style={styles.sortRow}>
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
          style={styles.primaryBtn}
          onPress={() => {
            navigation.setOptions?.({ headerBackTitle: '戻る' });
            router.push({
              pathname: '/shop/[id]/review',
              params: { id: shop.id },
            });
          }}
        >
          <Text style={styles.primaryBtnText}>レビューを書く</Text>
        </Pressable>

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
                  ★ {review.rating} ・ {new Date(review.createdAt).toLocaleDateString('ja-JP')}
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
                const menuName = resolveMenuName(review);
                if (!menuName) return null;
                return <Text style={styles.reviewMenu}>メニュー: {menuName}</Text>;
              })()}
              {review.comment ? <Text style={styles.reviewBody}>{review.comment}</Text> : null}
              {review.files.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.reviewFiles}
                >
                  {review.files.map(file => {
                    const url = getPublicStorageUrl(file.objectKey);
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  arrowButtonLeft: {
    left: 12,
  },
  arrowButtonRight: {
    right: 12,
  },
  btnPressed: { opacity: 0.9 },
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
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: { padding: 16 },
  content: { paddingBottom: 24 },
  description: {
    color: palette.primaryText,
    lineHeight: 20,
    marginTop: 12,
  },
  favBtn: { marginLeft: 8 },
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
  hero: {
    backgroundColor: palette.heroPlaceholder,
    height: 220,
    width: SCREEN_WIDTH,
  },
  heroContainer: { marginBottom: 0, position: 'relative' },
  likeButton: {
    backgroundColor: palette.highlight,
    borderColor: palette.accent,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  likeButtonActive: {
    backgroundColor: palette.highlight,
    borderColor: palette.accent,
  },
  likeText: { color: palette.muted, fontSize: 12, fontWeight: '600' },
  likeTextActive: { color: palette.accent },
  mapButton: {
    alignItems: 'center',
    backgroundColor: palette.secondarySurface,
    borderColor: palette.border,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
    paddingVertical: 14,
  },
  mapButtonText: { color: palette.primary, fontWeight: '700' },
  mapCard: {
    marginTop: 12,
    padding: 12,
  },
  meta: { color: palette.secondaryText, marginTop: 6 },
  muted: { color: palette.muted },
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
    marginTop: 13,
    paddingVertical: 12,
  },
  primaryBtnText: {
    color: palette.primaryOnAccent,
    fontWeight: '700',
    textAlign: 'center',
  },
  reviewBody: { color: palette.primaryText, marginTop: 8 },
  reviewFiles: { marginTop: 12 },
  reviewHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reviewImage: {
    borderRadius: 12,
    height: 88,
    marginRight: 10,
    width: 88,
  },
  reviewMenu: { color: palette.muted, marginTop: 6 },
  reviewTitle: { color: palette.primaryText, fontWeight: '700' },
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
  secondaryBtnText: { color: palette.textOnSecondary, fontWeight: '700' },
  sectionHeader: { marginBottom: 8, marginTop: 16 },
  sectionSub: { color: palette.secondaryText, marginTop: 2 },
  sectionTitle: {
    color: palette.primaryText,
    fontSize: 18,
    fontWeight: '700',
  },
  shareBtn: {
    marginLeft: 8,
    padding: 4,
  },
  shareBtnDisabled: { opacity: 0.4 },
  sortPill: {
    backgroundColor: palette.secondarySurface,
    borderColor: palette.border,
    borderRadius: 999,
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
  sortText: { color: palette.muted, fontSize: 12, fontWeight: '600' },
  sortTextActive: { color: palette.primaryOnAccent },
  tagPill: {
    backgroundColor: palette.tagSurface,
    borderRadius: 999,
    marginRight: 8,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 },
  tagText: { color: palette.tagText, fontSize: 12, fontWeight: '600' },
  title: { color: palette.primaryText, fontSize: 22, fontWeight: '800' },
  visitedBtn: { marginLeft: 8 },
});
