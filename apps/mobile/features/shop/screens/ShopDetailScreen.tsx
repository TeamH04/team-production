import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useFavorites } from '@/features/favorites/FavoritesContext';
import { useReviews } from '@/features/reviews/ReviewsContext';
import { SHOPS, type Shop } from '@team/shop-core';

const palette = {
  accent: '#0EA5E9',
  arrowButtonBg: 'rgba(255, 255, 255, 0.9)',
  background: '#F9FAFB',
  border: '#E5E7EB',
  favoriteActive: '#DC2626',
  heroPlaceholder: '#E5E7EB',
  muted: '#6B7280',
  primary: '#111827',
  primaryOnAccent: '#FFFFFF',
  secondarySurface: '#F3F4F6',
  shadow: '#0f172a',
  surface: '#FFFFFF',
  tagSurface: '#F3F4F6',
  tagText: '#4B5563',
} as const;

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
  const { getReviews } = useReviews();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const shop = useMemo(() => SHOPS.find(s => s.id === id), [id]);

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

  const isFav = id ? isFavorite(id) : false;
  const reviews = id ? getReviews(id) : [];
  const imageUrls = shop?.imageUrls;
  const flatListRef = useRef<FlatList>(null);

  const scrollToImage = (index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
  };

  const handleShare = useCallback(() => {
    if (!shop) return;

    // ToDo: VercelにデプロイしたらURLを差し替える
    const url = `shopmobile://shop/${shop.id}`;

    Share.share({
      message: `${shop.name}\n${shop.description}\n${url}`,
      url,
      title: shop.name, // for android
    }).catch(err => {
      console.warn('Failed to share shop', err);
    });
  }, [shop]);

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
                  <Text style={styles.arrowText}>‹</Text>
                </Pressable>
              )}
              {currentImageIndex < imageUrls.length - 1 && (
                <Pressable
                  style={[styles.arrowButton, styles.arrowButtonRight]}
                  onPress={() => scrollToImage(currentImageIndex + 1)}
                  accessibilityLabel='次の画像'
                >
                  <Text style={styles.arrowText}>›</Text>
                </Pressable>
              )}
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
              style={({ pressed }) => [styles.shareBtn, pressed && styles.btnPressed]}
            >
              <Ionicons name='share-outline' size={22} color={palette.muted} />
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
                router.navigate({ pathname: '/(tabs)', params: { q: tag } });
              }}
            >
              <Text style={styles.tagText}>{tag}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>レビュー</Text>
          <Text style={styles.sectionSub}>みんなの感想や体験談</Text>
        </View>

        <Pressable
          style={styles.primaryBtn}
          onPress={() => {
            navigation.setOptions?.({ headerBackTitle: '戻る' });
            router.push({ pathname: '/shop/[id]/review', params: { id: shop.id } });
          }}
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
          reviews.map(review => (
            <View key={review.id} style={[styles.card, styles.cardShadow]}>
              <Text style={styles.reviewTitle}>
                ★ {review.rating} ・ {new Date(review.createdAt).toLocaleDateString('ja-JP')}
              </Text>
              {review.menuItemName ? (
                <Text style={styles.muted}>メニュー: {review.menuItemName}</Text>
              ) : null}
              {review.comment ? <Text style={styles.reviewBody}>{review.comment}</Text> : null}
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
  arrowText: {
    color: palette.primary,
    fontSize: 32,
    fontWeight: '600',
    lineHeight: 32,
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
    color: palette.primary,
    lineHeight: 20,
    marginTop: 12,
  },
  favBtn: { marginLeft: 12 },
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
  heroContainer: { marginBottom: 0, position: 'relative' },
  meta: { color: palette.muted, marginTop: 6 },
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
  paginationDotActive: { backgroundColor: palette.primaryOnAccent },
  primaryBtn: {
    backgroundColor: palette.accent,
    borderRadius: 12,
    marginBottom: 16,
    marginTop: 13,
    paddingVertical: 12,
  },
  primaryBtnText: { color: palette.primaryOnAccent, fontWeight: '700', textAlign: 'center' },
  reviewBody: { color: palette.primary, marginTop: 8 },
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
  secondaryBtnText: { color: palette.primary, fontWeight: '700' },
  sectionHeader: { marginBottom: 8, marginTop: 16 },
  sectionSub: { color: palette.muted, marginTop: 2 },
  sectionTitle: { color: palette.primary, fontSize: 18, fontWeight: '700' },
  shareBtn: {
    marginLeft: 8,
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
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 },
  tagText: { color: palette.tagText, fontSize: 12, fontWeight: '600' },
  title: { color: palette.primary, fontSize: 22, fontWeight: '800' },
});
