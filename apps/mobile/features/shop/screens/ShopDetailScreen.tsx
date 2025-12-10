import { Image } from 'expo-image';
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useFavorites } from '@/features/favorites/FavoritesContext';
import { SHOPS, type Shop } from '@/features/home/data/shops';
import { useReviews } from '@/features/reviews/ReviewsContext';

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

  // 画面にフォーカスが戻った時にheaderBackTitleを復元
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
      {/* 画像ギャラリー */}
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
              {/* 左矢印ボタン */}
              {currentImageIndex > 0 && (
                <Pressable
                  style={[styles.arrowButton, styles.arrowButtonLeft]}
                  onPress={() => scrollToImage(currentImageIndex - 1)}
                  accessibilityLabel='前の画像'
                >
                  <Text style={styles.arrowText}>‹</Text>
                </Pressable>
              )}
              {/* 右矢印ボタン */}
              {currentImageIndex < imageUrls.length - 1 && (
                <Pressable
                  style={[styles.arrowButton, styles.arrowButtonRight]}
                  onPress={() => scrollToImage(currentImageIndex + 1)}
                  accessibilityLabel='次の画像'
                >
                  <Text style={styles.arrowText}>›</Text>
                </Pressable>
              )}
              {/* ページネーションドット */}
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
          <Pressable
            accessibilityLabel='お気に入り切り替え'
            onPress={() => toggleFavorite(shop.id)}
            style={({ pressed }) => [styles.favBtn, pressed && styles.btnPressed]}
          >
            <Text style={[styles.favIcon, isFav && styles.favIconActive]}>
              {isFav ? '♥' : '♡'}
            </Text>
          </Pressable>
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
                // タグ検索も即時に、戻るテキストは維持
                navigation.setOptions?.({ headerBackTitle: '戻る' });
                router.navigate({ pathname: '/(tabs)', params: { q: tag } });
              }}
            >
              <Text style={styles.tagText}>{tag}</Text>
            </Pressable>
          ))}
        </View>

        {shop.paymentMethods && Object.keys(shop.paymentMethods).length > 0 ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>決済方法</Text>
            </View>
            {shop.paymentMethods.cash !== undefined && (
              <>
                <View style={styles.paymentSpacer} />
                <View style={styles.paymentCategoryContainer}>
                  <Text style={styles.paymentCategoryLabel}>現金</Text>
                  <View style={styles.paymentRow}>
                    {shop.paymentMethods.cash ? (
                      <Text style={styles.cashText}>利用可</Text>
                    ) : (
                      <Text style={styles.unavailableText}>利用不可</Text>
                    )}
                  </View>
                </View>
                <View style={styles.paymentSpacer} />
              </>
            )}
            {/* クレジットカード系 */}
            <View style={styles.paymentCategoryContainer}>
              <Text style={styles.paymentCategoryLabel}>クレジットカード</Text>
              <View style={styles.paymentRow}>
                {shop.paymentMethods.creditCard && shop.paymentMethods.creditCard.length > 0 ? (
                  shop.paymentMethods.creditCard.map(method => (
                    <View key={method} style={styles.paymentPill}>
                      <Text style={styles.paymentPillText}>{method}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.unavailableText}>利用不可</Text>
                )}
              </View>
            </View>
            {/* QRコード決済 */}
            <View style={styles.paymentCategoryContainer}>
              <Text style={styles.paymentCategoryLabel}>バーコード決済</Text>
              <View style={styles.paymentRow}>
                {shop.paymentMethods.qrCode && shop.paymentMethods.qrCode.length > 0 ? (
                  shop.paymentMethods.qrCode.map(method => (
                    <View key={method} style={styles.paymentPill}>
                      <Text style={styles.paymentPillText}>{method}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.unavailableText}>利用不可</Text>
                )}
              </View>
            </View>
            {/* モバイル決済 */}
            {shop.paymentMethods && (
              <View style={styles.paymentCategoryContainer}>
                <Text style={styles.paymentCategoryLabel}>モバイル決済</Text>
                <View style={styles.paymentRow}>
                  {shop.paymentMethods.mobilePay && shop.paymentMethods.mobilePay.length > 0 ? (
                    shop.paymentMethods.mobilePay.map(method => (
                      <View key={method} style={styles.paymentPill}>
                        <Text style={styles.paymentPillText}>{method}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.unavailableText}>利用不可</Text>
                  )}
                </View>
              </View>
            )}
            {/* その他 */}
            {shop.paymentMethods && (
              <View style={styles.paymentCategoryContainer}>
                <Text style={styles.paymentCategoryLabel}>電子マネー</Text>
                <View style={styles.paymentRow}>
                  {shop.paymentMethods.other && shop.paymentMethods.other.length > 0 ? (
                    shop.paymentMethods.other.map(method => (
                      <View key={method} style={styles.paymentPill}>
                        <Text style={styles.paymentPillText}>{method}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.unavailableText}>利用不可</Text>
                  )}
                </View>
              </View>
            )}
            {/* 交通系IC */}
            {shop.paymentMethods &&
              (() => {
                const transitAvailable =
                  shop.paymentMethods.transitAvailable ??
                  (shop.paymentMethods.transit && shop.paymentMethods.transit.length > 0);
                return (
                  <View style={styles.paymentCategoryContainer}>
                    <Text style={styles.paymentCategoryLabel}>交通系IC</Text>
                    <Text style={transitAvailable ? styles.cashText : styles.unavailableText}>
                      {transitAvailable ? '利用可' : '利用不可'}
                    </Text>
                  </View>
                );
              })()}
          </>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>レビュー</Text>
          <Text style={styles.sectionSub}>みんなの感想や体験談</Text>
        </View>

        <Pressable
          style={styles.primaryBtn}
          onPress={() => {
            // 戻るテキストは常に「戻る」に固定し、即座に遷移
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
  card: { backgroundColor: palette.surface, borderRadius: 16, padding: 16 },
  cardShadow: {
    elevation: 4,
    marginBottom: 16,
    shadowColor: palette.shadow,
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  cashText: {
    color: palette.primary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  centered: { alignItems: 'center', justifyContent: 'center' },
  container: { padding: 16 },
  content: { paddingBottom: 24 },
  description: { color: palette.primary, lineHeight: 20, marginTop: 12 },
  favBtn: { marginLeft: 12 },
  favIcon: { color: palette.muted, fontSize: 24 },
  favIconActive: { color: palette.favoriteActive },
  headerRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
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
  paymentCategoryContainer: {
    marginBottom: 12,
  },
  paymentCategoryLabel: {
    color: palette.primary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  paymentPill: {
    backgroundColor: palette.secondarySurface,
    borderColor: palette.border,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  paymentPillText: {
    color: palette.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  paymentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'flex-start',
    marginBottom: 12,
    marginTop: 8,
  },
  paymentSpacer: {
    height: 8,
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
  unavailableText: {
    color: palette.muted,
    fontSize: 13,
    fontWeight: '600',
  },
});
