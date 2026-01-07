import { Ionicons } from '@expo/vector-icons';
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

import { palette } from '@/constants/palette';
import { useFavorites } from '@/features/favorites/FavoritesContext';
import { useReviews } from '@/features/reviews/ReviewsContext';
import { SHOPS, type Shop } from '@team/shop-core';

const BUDGET_LABEL: Record<Shop['budget'], string> = {
  $: '¥',
  $$: '¥¥',
  $$$: '¥¥¥',
};

const SCREEN_WIDTH = Dimensions.get('window').width;

// カラーリテラル対策
const WHITE = '#FFFFFF';

export default function ShopDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id;
  const router = useRouter();
  const navigation = useNavigation();

  const { isFavorite, toggleFavorite } = useFavorites();
  const { getReviews, toggleReviewLike, isReviewLiked } = useReviews();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const shop = useMemo(() => SHOPS.find(s => s.id === id), [id]);
  const webBaseUrl = process.env.EXPO_PUBLIC_WEB_BASE_URL?.replace(/\/$/, '');

  useLayoutEffect(() => {
    if (shop) {
      navigation.setOptions?.({ title: shop.name, headerBackTitle: '戻る' });
    }
  }, [navigation, shop]);

  useFocusEffect(
    useCallback(() => {
      navigation.setOptions?.({ headerBackTitle: '戻る' });
    }, [navigation])
  );

  const isFav = shop ? isFavorite(shop.id) : false;
  const reviews = shop ? getReviews(shop.id) : [];
  const imageUrls = shop?.imageUrls;
  const flatListRef = useRef<FlatList>(null);
  const mapOpenUrl = useMemo(
    () =>
      shop?.placeId
        ? `https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${shop.placeId}`
        : null,
    [shop?.placeId]
  );

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
      title: shop.name,
      url,
    }).catch(() => Alert.alert('共有に失敗しました', 'もう一度お試しください。'));
  }, [shop, webBaseUrl]);

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
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <View style={styles.heroContainer}>
        <FlatList
          data={imageUrls?.length ? imageUrls : [shop.imageUrl]}
          horizontal
          keyExtractor={(_, index) => index.toString()}
          onMomentumScrollEnd={event => {
            const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
            setCurrentImageIndex(index);
          }}
          pagingEnabled
          ref={flatListRef}
          renderItem={({ item }) => (
            <Image contentFit='cover' source={{ uri: item }} style={styles.hero} />
          )}
          showsHorizontalScrollIndicator={false}
        />

        {imageUrls && imageUrls.length > 1 && (
          <View style={styles.paginationContainer}>
            {imageUrls.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.paginationDot,
                  idx === currentImageIndex && styles.paginationDotActive,
                ]}
              />
            ))}
          </View>
        )}
      </View>

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
                !webBaseUrl && { opacity: 0.4 },
              ]}
            >
              <Ionicons color={palette.muted} name='share-outline' size={22} />
            </Pressable>

            <Pressable onPress={() => toggleFavorite(shop.id)} style={styles.favBtn}>
              <Ionicons
                color={isFav ? palette.favoriteActive : palette.muted}
                name={isFav ? 'heart' : 'heart-outline'}
                size={24}
              />
            </Pressable>
          </View>
        </View>

        <Text style={styles.meta}>
          {`${shop.category} │ 徒歩${shop.distanceMinutes}分 │ 予算 ${BUDGET_LABEL[shop.budget]} │ ★ ${shop.rating.toFixed(1)}`}
        </Text>

        <Text style={styles.description}>{shop.description}</Text>

        <View style={styles.tagRow}>
          {shop.tags.map(tag => (
            <Pressable
              key={tag}
              onPress={() => {
                router.navigate({
                  params: { tag: tag },
                  pathname: '/(tabs)',
                });
              }}
              style={styles.tagPill}
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
              onPress={() => Linking.openURL(mapOpenUrl)}
              accessibilityLabel={`${shop.name} の場所をマップで開く`}
            >
              <Text style={styles.mapButtonText}>マップで開く</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>レビュー</Text>
        </View>

        <Pressable
          onPress={() => router.push({ params: { id: shop.id }, pathname: '/shop/[id]/review' })}
          style={styles.primaryBtn}
        >
          <Text style={styles.primaryBtnText}>レビューを書く</Text>
        </Pressable>

        {reviews.length === 0 ? (
          <View style={[styles.card, styles.cardShadow]}>
            <Text style={styles.muted}>
              まだレビューがありません。最初のレビューを投稿しましょう！
            </Text>
          </View>
        ) : (
          (() => {
            // isReviewLiked の呼び出しをメモ化してパフォーマンス改善
            const likedReviewsMap = new Map(
              reviews.map(review => [review.id, isReviewLiked(review.id)])
            );
            return reviews.map(review => {
              const isLiked = likedReviewsMap.get(review.id) ?? false;
              return (
                <View key={review.id} style={[styles.card, styles.cardShadow]}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.reviewLeft}>
                      <Text style={styles.reviewTitle}>
                        ★ {review.rating} ・{' '}
                        {new Date(review.createdAt).toLocaleDateString('ja-JP')}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => toggleReviewLike(review.id)}
                      style={({ pressed }) => [styles.reviewLikeBtn, pressed && styles.btnPressed]}
                      accessibilityLabel='レビューをいいね'
                    >
                      <Ionicons
                        name={isLiked ? 'heart' : 'heart-outline'}
                        size={20}
                        color={isLiked ? palette.accent : palette.muted}
                      />
                    </Pressable>
                  </View>
                  {review.menuItemName ? (
                    <Text style={styles.muted}>メニュー: {review.menuItemName}</Text>
                  ) : null}
                  {review.comment ? <Text style={styles.reviewBody}>{review.comment}</Text> : null}
                </View>
              );
            });
          })()
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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

  container: {
    padding: 16,
  },

  content: {
    paddingBottom: 24,
  },

  description: {
    color: palette.primary,
    lineHeight: 20,
    marginTop: 12,
  },

  favBtn: {
    marginLeft: 12,
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
  hero: { backgroundColor: palette.heroPlaceholder, height: 220, width: SCREEN_WIDTH },
  heroContainer: {
    backgroundColor: palette.heroPlaceholder,
    marginBottom: 0,
    position: 'relative',
  },
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

  meta: {
    color: palette.muted,
    marginTop: 6,
  },
  muted: {
    color: palette.muted,
    marginTop: 6,
  },

  paginationContainer: {
    bottom: 12,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    position: 'absolute',
    width: '100%',
  },

  paginationDot: {
    backgroundColor: palette.muted,
    borderRadius: 3,
    height: 6,
    opacity: 0.5,
    width: 6,
  },

  paginationDotActive: {
    backgroundColor: WHITE, // リテラルを排除
    opacity: 1,
  },

  primaryBtn: {
    backgroundColor: palette.accent,
    borderRadius: 12,
    marginBottom: 16,
    marginTop: 13,
    paddingVertical: 12,
  },
  primaryBtnText: { color: palette.primaryOnAccent, fontWeight: '700', textAlign: 'center' },
  reviewBody: { color: palette.primary, marginTop: 8 },
  reviewHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reviewLeft: { flex: 1 },
  reviewLikeBtn: { padding: 4 },
  btnPressed: { opacity: 0.7 },
  reviewTitle: { color: palette.primary, fontWeight: '700' },
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

  sectionHeader: {
    marginBottom: 8,
    marginTop: 16,
  },

  sectionTitle: {
    color: palette.primary,
    fontSize: 18,
    fontWeight: '700',
  },

  shareBtn: {
    padding: 4,
  },

  tagPill: {
    backgroundColor: palette.tagSurface,
    borderRadius: 999,
    marginRight: 8,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },

  tagText: {
    color: palette.tagText,
    fontSize: 12,
    fontWeight: '600',
  },

  title: {
    color: palette.primary,
    fontSize: 22,
    fontWeight: '800',
  },
});
