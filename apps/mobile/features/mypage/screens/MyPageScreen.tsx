import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { SHOPS, type Shop } from '@/features/home/data/shops';
import { useFavorites } from '@/features/favorites/FavoritesContext';
import { useReviews } from '@/features/reviews/ReviewsContext';
import { useUser } from '@/features/user/UserContext';

const palette = {
  accent: '#0EA5E9',
  background: '#F9FAFB',
  border: '#E5E7EB',
  mutedText: '#6B7280',
  primary: '#111827',
  surface: '#FFFFFF',
  shadow: '#0f172a',
} as const;

export default function MyPageScreen() {
  const router = useRouter();
  const { favorites } = useFavorites();
  const { reviewsByShop } = useReviews();
  const { profile } = useUser();

  const favoriteShops = useMemo<Shop[]>(() => {
    const ids = Array.from(favorites);
    return SHOPS.filter((s) => ids.includes(s.id));
  }, [favorites]);

  const reviews = useMemo(() => {
    const all = Object.values(reviewsByShop).flat();
    return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 20);
  }, [reviewsByShop]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Profile Section */}
      <View style={[styles.cardShadow]}>
        <View style={styles.card}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>KY</Text>
            </View>
            <View style={styles.profileMeta}>
              <Text style={styles.profileName}>{profile.name}</Text>
              <Text style={styles.profileSub}>{profile.email}</Text>
            </View>
          </View>
          <Pressable
            onPress={() => router.push('/profile/edit')}
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
          >
            <Text style={styles.primaryBtnText}>プロフィールを編集</Text>
          </Pressable>
        </View>
      </View>

      {/* Favorites Section */}
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
          {favoriteShops.map((shop) => (
            <View style={[styles.cardShadow]} key={shop.id}>
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

      {/* Reviews Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>レビュー投稿履歴</Text>
        <Text style={styles.sectionSub}>最近投稿したレビュー</Text>
      </View>
      {reviews.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>まだレビューがありません</Text>
        </View>
      ) : (
        <View>
          {reviews.map((r) => {
            const shop = SHOPS.find((s) => s.id === r.shopId);
            return (
              <View style={[styles.cardShadow]} key={r.id}>
                <View style={styles.card}>
                  <Text style={styles.rowCardTitle}>{shop?.name ?? '不明な店舗'}</Text>
                  <Text style={styles.rowCardSub}>
                    ★ {r.rating} │ {new Date(r.createdAt).toLocaleDateString('ja-JP')}
                  </Text>
                  {r.menuItemName ? (
                    <Text style={styles.rowCardSub}>メニュー: {r.menuItemName}</Text>
                  ) : null}
                  <Text style={styles.reviewText}>{r.comment}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    borderRadius: 999,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  avatarText: {
    color: '#1D4ED8',
    fontSize: 22,
    fontWeight: '800',
  },
  btnPressed: {
    opacity: 0.9,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: 16,
  },
  cardShadow: {
    elevation: 4,
    marginBottom: 16,
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  emptyBox: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  emptyText: {
    color: palette.mutedText,
  },
  primaryBtn: {
    backgroundColor: palette.accent,
    borderRadius: 12,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  profileMeta: {
    flex: 1,
    marginLeft: 14,
  },
  profileName: {
    color: palette.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  profileRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  profileSub: {
    color: palette.mutedText,
    marginTop: 4,
  },
  reviewText: {
    color: palette.primary,
    marginTop: 8,
  },
  rowCard: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowCardMeta: {
    flex: 1,
    paddingRight: 12,
  },
  rowCardSub: {
    color: palette.mutedText,
    marginTop: 4,
  },
  rowCardTitle: {
    color: palette.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  screen: {
    backgroundColor: palette.background,
    flex: 1,
  },
  secondaryBtn: {
    backgroundColor: '#F3F4F6',
    borderColor: palette.border,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  secondaryBtnText: {
    color: palette.primary,
    fontWeight: '700',
  },
  sectionHeader: {
    marginBottom: 8,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  sectionSub: {
    color: palette.mutedText,
    fontSize: 13,
    marginTop: 2,
  },
  sectionTitle: {
    color: palette.primary,
    fontSize: 18,
    fontWeight: '700',
  },
});
