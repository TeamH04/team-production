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
  TextInput,
  View,
} from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';

import { Collapsible } from '@/components/Collapsible';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useFavorites } from '@/features/favorites/FavoritesContext';
import { useReviews } from '@/features/reviews/ReviewsContext';
import { SHOPS, type Shop } from '@team/shop-core';

const PaginationDot = ({ active }: { active: boolean }) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: withSpring(active ? 24 : 8, { damping: 24, stiffness: 160 }),
      backgroundColor: withSpring(active ? '#FFFFFF' : 'rgba(255, 255, 255, 0.4)', {
        damping: 24,
        stiffness: 160,
      }),
    };
  });

  return <Animated.View style={[styles.paginationDot, animatedStyle]} />;
};

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

type MenuItem = NonNullable<Shop['menu']>[number];

const SCREEN_WIDTH = Dimensions.get('window').width;
const GALLERY_ITEM_SIZE = (SCREEN_WIDTH - 48) / 3;

export default function ShopDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const navigation = useNavigation();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { getReviews, addReview } = useReviews();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [newReview, setNewReview] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [reviewError, setReviewError] = useState('');
  const [favoriteMenuIds, setFavoriteMenuIds] = useState<Record<string, boolean>>({});

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

  const isFav = id ? isFavorite(id) : false;
  const reviews = id ? getReviews(id) : [];
  const reviewCount = (shop?.reviewCount ?? 0) + reviews.length;
  const imageUrls = shop?.imageUrls;
  const flatListRef = useRef<FlatList>(null);
  const menuGroups = useMemo(() => {
    const groups: Record<string, MenuItem[]> = {};
    (shop?.menu ?? []).forEach(item => {
      const key = item.category ?? 'おすすめ';
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    });
    return groups;
  }, [shop?.menu]);
  const menuCategories = useMemo(() => Object.keys(menuGroups), [menuGroups]);
  const similarShops = useMemo(() => {
    if (!shop) return [] as Shop[];
    return SHOPS.filter(s => s.id !== shop.id && s.category === shop.category).slice(0, 3);
  }, [shop]);

  const scrollToImage = (index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
  };

  const handleNavigation = useCallback(() => {
    if (!shop) return;
    const destination =
      shop.latitude && shop.longitude
        ? `${shop.latitude},${shop.longitude}`
        : encodeURIComponent(shop.address);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    Linking.openURL(url).catch(() => console.warn('could not open map'));
  }, [shop]);

  const handleMenuFavoriteToggle = useCallback((menuId: string) => {
    setFavoriteMenuIds(prev => ({ ...prev, [menuId]: !prev[menuId] }));
  }, []);

  const handleTagClick = useCallback(
    (tag: string) => {
      navigation.setOptions?.({ headerBackTitle: '戻る' });
      router.navigate({ pathname: '/(tabs)', params: { q: tag } });
    },
    [navigation, router]
  );

  const handleQuickReviewSubmit = useCallback(() => {
    if (!shop) return;
    if (!newReview.trim()) {
      setReviewError('コメントを入力してください');
      return;
    }
    addReview(shop.id, { rating: newRating, comment: newReview });
    setNewReview('');
    setNewRating(5);
    setReviewError('');
  }, [addReview, newRating, newReview, shop]);

  const handleShare = useCallback(() => {
    if (!shop) return;

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
    <>
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
                <View style={[styles.paginationContainer, styles.paginationOverlay]}>
                  {imageUrls?.map((_, index) => (
                    <Pressable
                      key={index}
                      onPress={() => {
                        setCurrentImageIndex(index);
                        scrollToImage(index);
                      }}
                    >
                      <PaginationDot active={index === currentImageIndex} />
                    </Pressable>
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
                  styles.headerBtn,
                  pressed && styles.btnPressed,
                  !webBaseUrl && { opacity: 0.4 },
                ]}
              >
                <Ionicons name='share-outline' size={27} color={palette.muted} />
              </Pressable>
              <Pressable
                accessibilityLabel='お気に入り切り替え'
                onPress={() => toggleFavorite(shop.id)}
                style={({ pressed }) => [styles.headerBtn, pressed && styles.btnPressed]}
              >
                <IconSymbol
                  name={isFav ? 'heart.fill' : 'heart'}
                  size={26}
                  color={isFav ? palette.favoriteActive : palette.muted}
                />
              </Pressable>
            </View>
          </View>

          <Text
            style={styles.meta}
          >{`${shop.category} │ 徒歩${shop.distanceMinutes}分 │ 予算 ${BUDGET_LABEL[shop.budget]} │ ★ ${shop.rating.toFixed(1)} (${reviewCount}件)`}</Text>

          <Text style={styles.description}>{shop.description}</Text>

          <View style={styles.tagRow}>
            {shop.tags.map(tag => (
              <Pressable
                key={tag}
                style={styles.tagPill}
                accessibilityLabel={`タグ ${tag} で検索`}
                onPress={() => handleTagClick(tag)}
              >
                <Text style={styles.tagText}>{tag}</Text>
              </Pressable>
            ))}
          </View>

          {/* 店舗情報 */}
          <Collapsible
            title='店舗情報'
            style={styles.sectionHeader}
            titleStyle={styles.sectionTitle}
            iconColor={palette.primary}
          >
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>住所</Text>
              <Text style={styles.infoValue}>{shop.address}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>営業時間</Text>
              <Text style={styles.infoValue}>{shop.operatingHours}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>定休日</Text>
              <Text style={styles.infoValue}>{shop.regularHoliday}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>電話番号</Text>
              <Pressable onPress={() => Linking.openURL(`tel:${shop.phoneNumber}`)}>
                <Text style={[styles.infoValue, styles.linkText]}>{shop.phoneNumber}</Text>
              </Pressable>
            </View>
            {shop.website && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>公式サイト</Text>
                <Pressable onPress={() => Linking.openURL(shop.website ?? '')}>
                  <Text style={[styles.infoValue, styles.linkText]}>{shop.website}</Text>
                </Pressable>
              </View>
            )}
            {shop.features && shop.features.length > 0 && (
              <View style={styles.featuresContainer}>
                <Text style={styles.infoLabel}>設備・サービス</Text>
                <View style={styles.featuresRow}>
                  {shop.features.map(feature => (
                    <View key={feature} style={styles.featurePill}>
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            <View style={[styles.sectionCard, styles.mapCard]}>
              <Text style={styles.sectionTitle}>地図</Text>
              <Image
                source={{
                  uri: 'https://images.unsplash.com/photo-1759347171940-d79bc7024948?crop=entropy&cs=tinysrgb&fit=max&w=1080&q=80',
                }}
                style={styles.mapImage}
                contentFit='cover'
              />
              <Pressable style={[styles.secondaryBtn, styles.mapButton]} onPress={handleNavigation}>
                <Text style={styles.secondaryBtnText}>大きな地図で見る</Text>
              </Pressable>
            </View>
          </Collapsible>

          {/* メニュー */}
          <Collapsible
            title='メニュー'
            style={styles.sectionHeader}
            titleStyle={styles.sectionTitle}
            iconColor={palette.primary}
            contentContainerStyle={styles.menuContent}
          >
            {menuCategories.length > 0 ? (
              menuCategories.map(category => (
                <View key={category} style={styles.menuCategory}>
                  <Text style={styles.menuCategoryTitle}>{category}</Text>
                  {menuGroups[category]?.map(item => (
                    <View key={item.id} style={[styles.menuItem, styles.menuCard]}>
                      <View style={styles.menuItemInfo}>
                        <Text style={styles.menuItemTitle}>{item.name}</Text>
                        {item.description ? (
                          <Text style={styles.menuDescription}>{item.description}</Text>
                        ) : null}
                        <Text style={styles.menuPrice}>{item.price ?? '価格未設定'}</Text>
                      </View>
                      <Pressable
                        accessibilityLabel={`${item.name} をお気に入り`}
                        onPress={() => handleMenuFavoriteToggle(item.id)}
                        style={({ pressed }) => [styles.menuFavBtn, pressed && styles.btnPressed]}
                      >
                        <IconSymbol
                          name={favoriteMenuIds[item.id] ? 'heart.fill' : 'heart'}
                          size={20}
                          color={favoriteMenuIds[item.id] ? palette.favoriteActive : palette.muted}
                        />
                      </Pressable>
                    </View>
                  ))}
                </View>
              ))
            ) : (
              <Text style={styles.muted}>
                メニュー情報は準備中です。公開まで少々お待ちください。
              </Text>
            )}
            <Pressable
              style={[styles.secondaryBtn, styles.favoriteAction]}
              onPress={() => toggleFavorite(shop.id)}
            >
              <Text style={styles.secondaryBtnText}>
                {isFav ? 'お気に入りから外す' : 'お気に入りに追加'}
              </Text>
            </Pressable>
          </Collapsible>

          {/* 決済方法 */}
          {shop.paymentMethods && Object.keys(shop.paymentMethods).length > 0 ? (
            <Collapsible
              title='決済方法'
              style={styles.sectionHeader}
              titleStyle={styles.sectionTitle}
              iconColor={palette.primary}
            >
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
            </Collapsible>
          ) : null}

          <Collapsible
            title='レビュー'
            style={styles.sectionHeader}
            titleStyle={styles.sectionTitle}
            iconColor={palette.primary}
          >
            <Text style={styles.sectionSub}>みんなの感想や体験談（{reviewCount}件）</Text>

            <View style={[styles.card, styles.quickReviewCard]}>
              <Text style={styles.quickReviewTitle}>この画面で投稿</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map(n => (
                  <Pressable key={n} onPress={() => setNewRating(n)}>
                    <Text style={[styles.star, n <= newRating ? styles.starActive : undefined]}>
                      ★
                    </Text>
                  </Pressable>
                ))}
              </View>
              <TextInput
                value={newReview}
                onChangeText={setNewReview}
                placeholder='お店の感想を書いてください'
                placeholderTextColor={palette.muted}
                style={styles.reviewInput}
                multiline
              />
              {reviewError ? <Text style={styles.errorText}>{reviewError}</Text> : null}
              <Pressable
                style={[styles.primaryBtn, styles.reviewSubmitBtn]}
                onPress={handleQuickReviewSubmit}
              >
                <Text style={styles.primaryBtnText}>投稿する</Text>
              </Pressable>
            </View>

            <Pressable
              style={styles.secondaryBtn}
              onPress={() => {
                navigation.setOptions?.({ headerBackTitle: '戻る' });
                router.push({ pathname: '/shop/[id]/review', params: { id: shop.id } });
              }}
            >
              <Text style={styles.secondaryBtnText}>詳しくレビューを書く</Text>
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
          </Collapsible>

          {imageUrls && imageUrls.length > 0 ? (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>フォトギャラリー</Text>
              <View style={styles.galleryGrid}>
                {imageUrls.map((uri, index) => (
                  <Image
                    key={index}
                    source={{ uri }}
                    style={styles.galleryImage}
                    contentFit='cover'
                  />
                ))}
              </View>
            </View>
          ) : null}

          {similarShops.length > 0 ? (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>近くの類似店舗</Text>
              {similarShops.map(similar => (
                <Pressable
                  key={similar.id}
                  style={[styles.card, styles.similarCard, styles.cardShadow]}
                  onPress={() =>
                    router.push({ pathname: '/shop/[id]', params: { id: similar.id } })
                  }
                >
                  <View style={styles.similarRow}>
                    <Image
                      source={{ uri: similar.imageUrl }}
                      style={styles.similarImage}
                      contentFit='cover'
                    />
                    <View style={styles.similarInfo}>
                      <Text style={styles.similarTitle}>{similar.name}</Text>
                      <Text style={styles.similarMeta}>
                        {similar.category} │ 徒歩{similar.distanceMinutes}分
                      </Text>
                      <Text style={styles.similarRating}>★ {similar.rating.toFixed(1)}</Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </>
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

  arrowButtonLeft: { left: 12 },
  arrowButtonRight: { right: 12 },
  arrowText: { color: palette.primary, fontSize: 32, fontWeight: '600', lineHeight: 32 },
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
  cashText: { color: palette.primary, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  container: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },

  content: { paddingBottom: 40 },
  description: { color: palette.primary, lineHeight: 20, marginTop: 12 },
  errorText: { color: palette.favoriteActive, marginTop: 4 },
  favoriteAction: { marginTop: 12 },
  featurePill: {
    backgroundColor: palette.secondarySurface,
    borderRadius: 8,
    marginRight: 8,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  featureText: { color: palette.tagText, fontSize: 12, fontWeight: '500' },

  featuresContainer: { marginTop: 12 },
  featuresRow: { flexDirection: 'row', flexWrap: 'wrap' },
  galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  galleryImage: {
    borderRadius: 12,
    height: GALLERY_ITEM_SIZE,
    width: GALLERY_ITEM_SIZE,
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  headerBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  headerRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  hero: { backgroundColor: palette.heroPlaceholder, height: 220, width: SCREEN_WIDTH },

  heroContainer: { marginBottom: 0, position: 'relative' },
  infoLabel: {
    color: palette.muted,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
    width: 80,
  },
  infoRow: {
    borderBottomColor: palette.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingVertical: 12,
  },
  infoValue: { color: palette.primary, flex: 1, fontSize: 14, lineHeight: 20 },

  linkText: { color: palette.accent, textDecorationLine: 'underline' },
  mapButton: { marginTop: 10 },

  mapCard: { marginTop: 12 },
  mapImage: { borderRadius: 12, height: 150, marginTop: 8 },
  menuCard: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  menuCategory: { gap: 8, marginTop: 8 },
  menuCategoryTitle: { color: palette.primary, fontWeight: '700' },
  menuContent: { gap: 8, marginTop: 8 },
  menuDescription: { color: palette.muted, fontSize: 13, marginTop: 2 },
  menuFavBtn: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: 12,
    width: 40,
  },

  menuItem: {
    backgroundColor: palette.secondarySurface,
    borderColor: palette.border,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  menuItemInfo: { flex: 1 },
  menuItemTitle: { color: palette.primary, fontSize: 15, fontWeight: '700' },
  menuPrice: { color: palette.primary, fontWeight: '700', marginTop: 6 },
  meta: { color: palette.muted, marginTop: 6 },
  muted: { color: palette.muted },
  paginationContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
  },
  paginationDot: {
    borderRadius: 999,
    height: 8,
    marginHorizontal: 3,
  },
  paginationOverlay: { bottom: 16, left: 0, position: 'absolute', right: 0 },
  paymentCategoryContainer: { marginBottom: 12 },
  paymentCategoryLabel: { color: palette.primary, fontWeight: '700', marginBottom: 6 },

  paymentPill: {
    backgroundColor: palette.secondarySurface,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  paymentPillText: { color: palette.primary, fontWeight: '600' },
  paymentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  paymentSpacer: { height: 8 },
  primaryBtn: {
    alignItems: 'center',
    backgroundColor: palette.accent,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryBtnText: { color: palette.primaryOnAccent, fontWeight: '700' },
  quickReviewCard: { gap: 8, marginTop: 8 },
  quickReviewTitle: { color: palette.primary, fontWeight: '700' },

  reviewBody: { color: palette.primary, marginTop: 4 },
  reviewInput: {
    backgroundColor: palette.secondarySurface,
    borderColor: palette.border,
    borderRadius: 12,
    borderWidth: 1,
    color: palette.primary,
    minHeight: 80,
    padding: 12,
    textAlignVertical: 'top',
  },
  reviewSubmitBtn: { marginTop: 4 },

  reviewTitle: { color: palette.primary, fontWeight: '700', marginBottom: 4 },
  screen: { backgroundColor: palette.surface, flex: 1 },
  secondaryBtn: {
    alignItems: 'center',
    backgroundColor: palette.secondarySurface,
    borderColor: palette.border,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  secondaryBtnText: { color: palette.primary, fontWeight: '700' },
  sectionCard: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 16,
    padding: 20,
  },
  sectionHeader: { marginBottom: 6, marginTop: 16 },
  sectionSub: { color: palette.muted, marginBottom: 8 },
  sectionTitle: { color: palette.primary, fontSize: 16, fontWeight: '800', marginBottom: 6 },
  similarCard: { marginTop: 12 },
  similarImage: { borderRadius: 12, height: 72, width: 72 },
  similarInfo: { flex: 1, gap: 4 },
  similarMeta: { color: palette.muted },
  similarRating: { color: palette.primary, fontWeight: '700' },

  similarRow: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  similarTitle: { color: palette.primary, fontSize: 15, fontWeight: '700' },

  star: { color: palette.muted, fontSize: 20 },
  starActive: { color: palette.accent },
  starsRow: { flexDirection: 'row', gap: 6 },
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
  unavailableText: { color: palette.muted, fontSize: 13, fontWeight: '600' },
});
