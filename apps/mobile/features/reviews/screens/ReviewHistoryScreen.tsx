import { palette } from '@/constants/palette';
import { TAB_BAR_SPACING } from '@/constants/TabBarSpacing';
import { useFavorites } from '@/features/favorites/FavoritesContext';
import { useReviews } from '@/features/reviews/ReviewsContext';
import { useStores } from '@/features/stores/StoresContext';
import { getPublicStorageUrl } from '@/lib/storage';
import type { Shop } from '@team/shop-core';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type TabType = 'favorites' | 'history' | 'likes';

export default function ReviewHistoryScreen() {
  const router = useRouter();
  const { favorites } = useFavorites();
  const { userReviews, loadUserReviews, getLikedReviews } = useReviews();
  const { stores, loading: storesLoading } = useStores();
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
          const message = err instanceof Error ? err.message : 'Unknown error';
          if (message === 'auth_required' && active) {
            setReviewAuthRequired(true);
          }
        })
        .finally(() => {
          if (active) setReviewLoading(false);
        });

      return () => {
        active = false;
      };
    }, [loadUserReviews])
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

  const resolveMenuName = useCallback(
    (shop: Shop | undefined, menuItemIds?: string[], menuItemName?: string) => {
      if (menuItemName) {
        return menuItemName;
      }
      if (!menuItemIds || menuItemIds.length === 0 || !shop?.menu) {
        return undefined;
      }
      const names = shop.menu.filter(item => menuItemIds.includes(item.id)).map(item => item.name);
      return names.length > 0 ? names.join(' / ') : undefined;
    },
    []
  );

  const renderReviewCard = useCallback(
    (review: (typeof reviews)[number]) => {
      const shop = stores.find(s => s.id === review.shopId);
      const menuName = resolveMenuName(shop, review.menuItemIds, review.menuItemName);

      return (
        <View key={review.id} style={styles.cardShadow}>
          <View style={styles.card}>
            <View style={styles.reviewHeader}>
              <Text style={styles.rowCardTitle}>{shop?.name ?? '不明な店舗'}</Text>
              <View style={styles.likePill}>
                <Text style={styles.likeText}>いいね {review.likesCount}</Text>
              </View>
            </View>

            <Text style={styles.rowCardSub}>
              ★ {review.rating} │ {new Date(review.createdAt).toLocaleDateString('ja-JP')}
            </Text>

            {menuName ? <Text style={styles.menuText}>メニュー: {menuName}</Text> : null}

            {review.comment ? <Text style={styles.reviewText}>{review.comment}</Text> : null}

            {review.files.length > 0 && (
              <View style={styles.reviewImages}>
                {review.files.map(file => {
                  const url = file.url ?? getPublicStorageUrl(file.objectKey);
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
    [resolveMenuName, stores]
  );

  const renderFavoriteCard = useCallback(
    (shop: Shop) => (
      <View key={shop.id} style={styles.cardShadow}>
        <View style={[styles.card, styles.rowCard]}>
          <View style={styles.rowCardMeta}>
            <Text style={styles.rowCardTitle}>{shop.name}</Text>
            <Text style={styles.rowCardSub}>
              {shop.category} │ ★ {shop.rating.toFixed(1)}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push({ pathname: '/shop/[id]', params: { id: shop.id } })}
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}
          >
            <Text style={styles.secondaryBtnText}>詳細</Text>
          </Pressable>
        </View>
      </View>
    ),
    [router]
  );

  const renderAuthRequired = (message: string) => (
    <View style={styles.emptyBox}>
      <Text style={styles.emptyText}>{message}</Text>
      <Pressable style={styles.secondaryBtn} onPress={() => router.push('/login')}>
        <Text style={styles.secondaryBtnText}>ログイン</Text>
      </Pressable>
    </View>
  );

  const renderTabContent = () => {
    if (activeTab === 'favorites') {
      if (storesLoading) {
        return (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>店舗情報を読み込み中...</Text>
          </View>
        );
      }
      return favoriteShops.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>お気に入りがありません</Text>
        </View>
      ) : (
        <View>{favoriteShops.map(renderFavoriteCard)}</View>
      );
    }

    if (activeTab === 'history') {
      if (reviewAuthRequired) {
        return renderAuthRequired('レビュー履歴を見るにはログインが必要です');
      }
      if (reviewLoading) {
        return (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>レビューを読み込み中...</Text>
          </View>
        );
      }
      return reviews.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>レビューがありません</Text>
        </View>
      ) : (
        <View>{reviews.map(renderReviewCard)}</View>
      );
    }

    if (reviewAuthRequired) {
      return renderAuthRequired('いいねしたレビューを見るにはログインが必要です');
    }
    return likedReviews.length === 0 ? (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyText}>いいねしたレビューがありません</Text>
      </View>
    ) : (
      <View>{likedReviews.map(renderReviewCard)}</View>
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
    elevation: 4,
    marginBottom: 16,
    shadowColor: palette.shadow,
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  content: { padding: 16, paddingBottom: TAB_BAR_SPACING },
  emptyBox: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  emptyText: { color: palette.mutedText, textAlign: 'center' },
  likePill: {
    backgroundColor: palette.secondarySurface,
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  likeText: { color: palette.mutedText, fontSize: 12, fontWeight: '700' },
  menuText: { color: palette.mutedText, marginTop: 6 },
  reviewHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  reviewImage: { borderRadius: 12, height: 88, width: 88 },
  reviewImages: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  reviewText: { color: palette.primary, marginTop: 8 },
  rowCard: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowCardMeta: { flex: 1, paddingRight: 12 },
  rowCardSub: { color: palette.mutedText, marginTop: 4 },
  rowCardTitle: { color: palette.primary, fontSize: 16, fontWeight: '700' },
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
    fontWeight: '700',
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
    fontSize: 14,
    fontWeight: '600',
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
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
});
