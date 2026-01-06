import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

import { palette } from '@/constants/palette';
import { TAB_BAR_SPACING } from '@/constants/TabBarSpacing';
import { useFavorites } from '@/features/favorites/FavoritesContext';
import { useReviews } from '@/features/reviews/ReviewsContext';
import { useUser } from '@/features/user/UserContext';
import { getCurrentUser } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';
import { getPublicStorageUrl } from '@/lib/storage';
import { SHOPS, type Shop } from '@team/shop-core';

export default function MyPageScreen() {
  const router = useRouter();
  const { favorites } = useFavorites();
  const { userReviews, loadUserReviews, getLikedReviews } = useReviews();
  const { profile } = useUser();

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
    return SHOPS.filter(shop => ids.includes(shop.id));
  }, [favorites]);

  const reviews = useMemo(() => {
    const sorted = [...userReviews].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return sorted.slice(0, 20);
  }, [userReviews]);

  const likedReviewsAll = useMemo(() => getLikedReviews(), [getLikedReviews]);
  const likedReviews = useMemo(() => likedReviewsAll.slice(0, 20), [likedReviewsAll]);

  const handleLogout = useCallback(async () => {
    try {
      await getSupabase().auth.signOut();
      router.replace('/login');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert('ログアウトに失敗しました', message);
    }
  }, [router]);

  const handleReviewLogin = useCallback(async () => {
    const user = await getCurrentUser();
    if (!user) {
      router.push('/login');
    }
  }, [router]);

  const resolveMenuName = useCallback(
    (shop: Shop | undefined, menuItemId?: string, menuItemName?: string) => {
      if (menuItemName) {
        return menuItemName;
      }
      if (!menuItemId || !shop?.menu) {
        return undefined;
      }
      return shop.menu.find(item => item.id === menuItemId)?.name;
    },
    []
  );

  const renderReviewCard = useCallback(
    (review: (typeof reviews)[number]) => {
      const shop = SHOPS.find(s => s.id === review.shopId);
      const menuName = resolveMenuName(shop, review.menuItemId, review.menuItemName);

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
              </View>
            )}
          </View>
        </View>
      );
    },
    [resolveMenuName]
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.cardShadow}>
        <View style={styles.card}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile.name ? profile.name.slice(0, 2).toUpperCase() : ''}
              </Text>
            </View>

            <View style={styles.profileMeta}>
              <Text style={styles.profileName}>{profile.name}</Text>
              <Text style={styles.profileSub}>{profile.email}</Text>
            </View>
            <Pressable onPress={handleLogout} style={styles.logoutBtn} hitSlop={8}>
              <Text style={styles.logoutText}>ログアウト</Text>
            </Pressable>
          </View>

          <Pressable onPress={() => router.push('/profile/edit')} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>プロフィールを編集</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>あなたの記録</Text>
        <Text style={styles.sectionSub}>お気に入りやレビューの概要</Text>
      </View>

      <View style={styles.cardShadow}>
        <View style={styles.card}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{favoriteShops.length}</Text>
              <Text style={styles.statLabel}>お気に入り</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {reviewAuthRequired ? 'ログイン' : userReviews.length}
              </Text>
              <Text style={styles.statLabel}>レビュー</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {reviewAuthRequired ? 'ログイン' : likedReviewsAll.length}
              </Text>
              <Text style={styles.statLabel}>いいね</Text>
            </View>
          </View>
          <Pressable style={styles.secondaryBtn} onPress={() => router.push('/review-history')}>
            <Text style={styles.secondaryBtnText}>履歴を見る</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>お気に入り店舗</Text>
        <Text style={styles.sectionSub}>ブックマークしたお店の一覧</Text>
      </View>

      {favoriteShops.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>まだお気に入りがありません</Text>
        </View>
      ) : (
        <View>
          {favoriteShops.map(shop => (
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
          ))}
        </View>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>レビュー投稿履歴</Text>
        <Text style={styles.sectionSub}>最近投稿したレビュー</Text>
      </View>

      {reviewAuthRequired ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>レビュー履歴を見るにはログインが必要です</Text>
          <Pressable style={styles.secondaryBtn} onPress={handleReviewLogin}>
            <Text style={styles.secondaryBtnText}>ログイン</Text>
          </Pressable>
        </View>
      ) : reviewLoading ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>レビューを読み込み中...</Text>
        </View>
      ) : reviews.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>まだレビューがありません</Text>
        </View>
      ) : (
        <View>{reviews.map(renderReviewCard)}</View>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>いいねしたレビュー</Text>
        <Text style={styles.sectionSub}>高評価にしたレビューの一覧</Text>
      </View>

      {reviewAuthRequired ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>いいねしたレビューを見るにはログインが必要です</Text>
          <Pressable style={styles.secondaryBtn} onPress={handleReviewLogin}>
            <Text style={styles.secondaryBtnText}>ログイン</Text>
          </Pressable>
        </View>
      ) : likedReviewsAll.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>いいねしたレビューがありません</Text>
        </View>
      ) : (
        <View>{likedReviews.map(renderReviewCard)}</View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    backgroundColor: palette.avatarBackground,
    borderRadius: 999,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  avatarText: { color: palette.avatarText, fontSize: 22, fontWeight: '800' },
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
  logoutBtn: {
    alignSelf: 'flex-start',
    marginLeft: 'auto',
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  logoutText: { color: palette.accent, fontSize: 14, fontWeight: '600' },
  menuText: { color: palette.mutedText, marginTop: 6 },
  primaryBtn: {
    backgroundColor: palette.secondarySurface,
    borderRadius: 12,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryBtnText: {
    color: palette.textOnSecondary,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  profileMeta: { flex: 1, marginLeft: 14 },
  profileName: { color: palette.primary, fontSize: 18, fontWeight: '700' },
  profileRow: { alignItems: 'center', flexDirection: 'row' },
  profileSub: { color: palette.mutedText, marginTop: 4 },
  reviewHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  reviewImage: { borderRadius: 12, height: 88, width: 88 },
  reviewImages: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  reviewText: { color: palette.primary, marginTop: 8 },
  rowCard: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
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
  secondaryBtnText: { color: palette.textOnSecondary, fontWeight: '700', textAlign: 'center' },
  sectionHeader: { marginBottom: 8, marginTop: 8, paddingHorizontal: 4 },
  sectionSub: { color: palette.mutedText, fontSize: 13, marginTop: 2 },
  sectionTitle: { color: palette.primary, fontSize: 18, fontWeight: '700' },
  statDivider: {
    backgroundColor: palette.border,
    height: 36,
    width: 1,
  },
  statItem: { alignItems: 'center', flex: 1 },
  statLabel: { color: palette.mutedText, fontSize: 12, marginTop: 4 },
  statValue: { color: palette.primary, fontSize: 20, fontWeight: '700' },
  statsRow: { alignItems: 'center', flexDirection: 'row', marginBottom: 12 },
});
