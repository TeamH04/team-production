import {
  BORDER_RADIUS,
  FONT_WEIGHT,
  formatRating,
  LAYOUT,
  ROUTES,
  SHADOW_STYLES,
} from '@team/constants';
import { formatDateJa } from '@team/core-utils';
import { useAuthErrorHandler } from '@team/hooks';
import { TabContent } from '@team/mobile-ui';
import { palette } from '@team/mobile-ui';
import { resolveMenuName, type Shop } from '@team/shop-core';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { fonts } from '@/constants/typography';
import { useFavorites } from '@/features/favorites/FavoritesContext';
import { useReviews } from '@/features/reviews/ReviewsContext';
import { useStores } from '@/features/stores/StoresContext';
import { useShopNavigator } from '@/hooks/useShopNavigator';
import { storage } from '@/lib/storage';

type TabType = 'favorites' | 'history' | 'likes';

export default function ReviewHistoryScreen() {
  const router = useRouter();
  const { navigateToShop } = useShopNavigator();
  const { favorites } = useFavorites();
  const { userReviews, loadUserReviews, getLikedReviews } = useReviews();
  const { stores, loading: storesLoading } = useStores();
  const { isAuthError } = useAuthErrorHandler();
  const [activeTab, setActiveTab] = useState<TabType>('history');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewAuthRequired, setReviewAuthRequired] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setReviewLoading(true);
      setReviewAuthRequired(false);

      loadUserReviews()
        .catch(err => {
          if (isAuthError(err) && active) {
            setReviewAuthRequired(true);
          }
        })
        .finally(() => {
          if (active) setReviewLoading(false);
        });

      return () => {
        active = false;
      };
    }, [isAuthError, loadUserReviews]),
  );

  const favoriteShops = useMemo<Shop[]>(() => {
    const ids = Array.from(favorites);
    return stores.filter(shop => ids.includes(shop.id));
  }, [favorites, stores]);

  const reviews = useMemo(() => {
    const sorted = [...userReviews].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return sorted;
  }, [userReviews]);

  const likedReviews = useMemo(() => {
    const sorted = getLikedReviews().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return sorted;
  }, [getLikedReviews]);

  const renderReviewCard = useCallback(
    (review: (typeof reviews)[number]) => {
      const shop = stores.find(s => s.id === review.shopId);
      const menuName = resolveMenuName(shop, review);

      return (
        <View style={styles.cardShadow}>
          <View style={styles.card}>
            <View style={styles.reviewHeader}>
              <Text style={styles.rowCardTitle}>{shop?.name ?? '不明な店舗'}</Text>
              <View style={styles.likePill}>
                <Text style={styles.likeText}>いいね {review.likesCount}</Text>
              </View>
            </View>

            <Text style={styles.rowCardSub}>
              ★ {review.rating} │ {formatDateJa(review.createdAt)}
            </Text>

            {menuName ? <Text style={styles.menuText}>メニュー: {menuName}</Text> : null}

            {review.comment ? <Text style={styles.reviewText}>{review.comment}</Text> : null}

            {review.files.length > 0 && (
              <View style={styles.reviewImages}>
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
              </View>
            )}
          </View>
        </View>
      );
    },
    [stores],
  );

  const renderFavoriteCard = useCallback(
    (shop: Shop) => (
      <View style={styles.cardShadow}>
        <View style={[styles.card, styles.rowCard]}>
          <View style={styles.rowCardMeta}>
            <Text style={styles.rowCardTitle}>{shop.name}</Text>
            <Text style={styles.rowCardSub}>
              {shop.category} │ ★ {formatRating(shop.rating)}
            </Text>
          </View>
          <Pressable
            onPress={() => navigateToShop(shop.id)}
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}
          >
            <Text style={styles.secondaryBtnText}>詳細</Text>
          </Pressable>
        </View>
      </View>
    ),
    [navigateToShop],
  );

  const renderAuthRequired = (message: string) => (
    <View style={styles.emptyBox}>
      <Text style={styles.emptyText}>{message}</Text>
      <Pressable style={styles.secondaryBtn} onPress={() => router.push(ROUTES.LOGIN)}>
        <Text style={styles.secondaryBtnText}>ログイン</Text>
      </Pressable>
    </View>
  );

  const renderTabContent = () => {
    if (activeTab === 'favorites') {
      return (
        <TabContent
          isLoading={storesLoading}
          loadingText='店舗情報を読み込み中...'
          items={favoriteShops}
          emptyText='お気に入りがありません'
          renderItem={renderFavoriteCard}
          keyExtractor={shop => shop.id}
        />
      );
    }

    if (activeTab === 'history') {
      if (reviewAuthRequired) {
        return renderAuthRequired('レビュー履歴を見るにはログインが必要です');
      }
      return (
        <TabContent
          isLoading={reviewLoading}
          loadingText='レビューを読み込み中...'
          items={reviews}
          emptyText='レビューがありません'
          renderItem={renderReviewCard}
          keyExtractor={review => review.id}
        />
      );
    }

    if (reviewAuthRequired) {
      return renderAuthRequired('いいねしたレビューを見るにはログインが必要です');
    }
    return (
      <TabContent
        isLoading={false}
        items={likedReviews}
        emptyText='いいねしたレビューがありません'
        renderItem={renderReviewCard}
        keyExtractor={review => review.id}
      />
    );
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.tabContainer}>
        <Pressable
          onPress={() => setActiveTab('favorites')}
          style={[styles.tabButton, activeTab === 'favorites' && styles.tabButtonActive]}
        >
          <Text
            style={[styles.tabButtonText, activeTab === 'favorites' && styles.tabButtonTextActive]}
          >
            お気に入り
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('history')}
          style={[styles.tabButton, activeTab === 'history' && styles.tabButtonActive]}
        >
          <Text
            style={[styles.tabButtonText, activeTab === 'history' && styles.tabButtonTextActive]}
          >
            レビュー履歴
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('likes')}
          style={[styles.tabButton, activeTab === 'likes' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabButtonText, activeTab === 'likes' && styles.tabButtonTextActive]}>
            いいね
          </Text>
        </Pressable>
      </View>

      <Text style={styles.tabTitle}>
        {activeTab === 'favorites'
          ? 'お気に入り'
          : activeTab === 'history'
            ? 'レビュー履歴'
            : 'いいねしたレビュー'}
      </Text>

      {renderTabContent()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  btnPressed: { opacity: 0.9 },
  card: { backgroundColor: palette.surface, borderRadius: 20, padding: 16 },
  cardShadow: {
    ...SHADOW_STYLES.CARD,
    marginBottom: 16,
  },
  content: { padding: 16, paddingBottom: LAYOUT.TAB_BAR_SPACING },
  emptyBox: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  emptyText: { color: palette.mutedText, fontFamily: fonts.regular, textAlign: 'center' },
  likePill: {
    backgroundColor: palette.secondarySurface,
    borderColor: palette.border,
    borderRadius: BORDER_RADIUS.PILL,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  likeText: { color: palette.mutedText, fontFamily: fonts.medium, fontSize: 12 },
  menuText: { color: palette.mutedText, fontFamily: fonts.regular, marginTop: 6 },
  reviewHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  reviewImage: {
    borderRadius: 12,
    height: LAYOUT.REVIEW_IMAGE_SIZE,
    width: LAYOUT.REVIEW_IMAGE_SIZE,
  },
  reviewImages: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  reviewText: { color: palette.primary, fontFamily: fonts.regular, marginTop: 8 },
  rowCard: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowCardMeta: { flex: 1, paddingRight: 12 },
  rowCardSub: { color: palette.mutedText, fontFamily: fonts.regular, marginTop: 4 },
  rowCardTitle: { color: palette.primary, fontFamily: fonts.medium, fontSize: 16 },
  screen: { backgroundColor: palette.background, flex: 1 },
  secondaryBtn: {
    backgroundColor: palette.secondarySurface,
    borderColor: palette.border,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  secondaryBtnText: {
    color: palette.textOnSecondary,
    fontFamily: fonts.medium,
    textAlign: 'center',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
  },
  tabButtonActive: {
    borderBottomColor: palette.accent,
    borderBottomWidth: 3,
  },
  tabButtonText: {
    color: palette.mutedText,
    fontFamily: fonts.medium,
    fontSize: 14,
    textAlign: 'center',
  },
  tabButtonTextActive: {
    color: palette.accent,
  },
  tabContainer: {
    borderBottomColor: palette.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    marginBottom: 16,
  },
  tabTitle: {
    color: palette.primary,
    fontFamily: fonts.medium,
    fontSize: 20,
    marginBottom: 12,
  },
});
