import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { useLayoutEffect, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SHOPS, type Shop } from '@/features/home/data/shops';
import { useFavorites } from '@/features/favorites/FavoritesContext';
import { useReviews } from '@/features/reviews/ReviewsContext';

const palette = {
  accent: '#0EA5E9',
  background: '#F9FAFB',
  border: '#E5E7EB',
  danger: '#EF4444',
  muted: '#6B7280',
  primary: '#111827',
  surface: '#FFFFFF',
  shadow: '#0f172a',
} as const;

const BUDGET_LABEL: Record<Shop['budget'], string> = {
  $: '¥',
  $$: '¥¥',
  $$$: '¥¥¥',
};

export default function ShopDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { getReviews } = useReviews();

  const shop = useMemo(() => SHOPS.find((s) => s.id === id), [id]);
  useLayoutEffect(() => {
    if (shop) {
      // Ensure header shows a human-readable title, never the route segment
      navigation.setOptions?.({ title: shop.name, headerBackTitle: '戻る' });
    }
  }, [navigation, shop]);
  const isFav = id ? isFavorite(id) : false;

  const reviews = id ? getReviews(id) : [];

  // Review creation is handled in a dedicated modal screen.

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
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 24 }}>
      <Image source={{ uri: shop.imageUrl }} style={styles.hero} contentFit="cover" />

      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{shop.name}</Text>
          <Pressable
            accessibilityLabel="お気に入り切り替え"
            onPress={() => toggleFavorite(shop.id)}
            style={({ pressed }) => [styles.favBtn, pressed && styles.btnPressed]}
          >
            <Text style={[styles.favIcon, isFav && styles.favIconActive]}>{isFav ? '♥' : '♡'}</Text>
          </Pressable>
        </View>

        <Text style={styles.meta}>{`${shop.category} │ 徒歩${shop.distanceMinutes}分 │ 予算 ${BUDGET_LABEL[shop.budget]} │ ★ ${shop.rating.toFixed(1)}`}</Text>

        <Text style={styles.description}>{shop.description}</Text>

        <View style={styles.tagRow}>
          {shop.tags.map((t) => (
            <View key={t} style={styles.tagPill}>
              <Text style={styles.tagText}>{t}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>レビュー</Text>
          <Text style={styles.sectionSub}>みんなの感想や体験談</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
          onPress={() => router.push({ pathname: '/shop/[id]/review', params: { id: shop.id } })}
        >
          <Text style={styles.primaryBtnText}>レビューを書く</Text>
        </Pressable>

        {/* Review List */}
        {reviews.length === 0 ? (
          <View style={[styles.card, styles.cardShadow]}>
            <Text style={styles.muted}>まだレビューがありません。最初のレビューを投稿しましょう！</Text>
          </View>
        ) : (
          reviews.map((r) => (
            <View key={r.id} style={[styles.card, styles.cardShadow]}>
              <Text style={styles.reviewTitle}>★ {r.rating} ・ {new Date(r.createdAt).toLocaleDateString('ja-JP')}</Text>
              {r.menuItemName ? (
                <Text style={styles.muted}>メニュー: {r.menuItemName}</Text>
              ) : null}
              <Text style={styles.reviewBody}>{r.comment}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  btnPressed: { opacity: 0.9 },
  card: { backgroundColor: palette.surface, borderRadius: 16, padding: 16 },
  cardShadow: {
    elevation: 4,
    marginBottom: 16,
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  centered: { alignItems: 'center', justifyContent: 'center' },
  container: { padding: 16 },
  description: { color: palette.primary, marginTop: 12, lineHeight: 20 },
  favBtn: { marginLeft: 12 },
  favIcon: { fontSize: 24, color: palette.muted },
  favIconActive: { color: '#DC2626' },
  formLabel: { color: palette.primary, fontWeight: '700', marginBottom: 8, marginTop: 8 },
  hero: { width: '100%', height: 220, backgroundColor: '#e5e7eb' },
  input: {
    backgroundColor: '#F9FAFB',
    borderColor: palette.border,
    borderRadius: 12,
    borderWidth: 1,
    color: palette.primary,
    minHeight: 80,
    padding: 12,
  },
  meta: { color: palette.muted, marginTop: 6 },
  muted: { color: palette.muted },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  primaryBtn: { backgroundColor: palette.accent, borderRadius: 12, paddingVertical: 12, marginTop: 12 },
  primaryBtnText: { color: '#fff', fontWeight: '700', textAlign: 'center' },
  reviewBody: { color: palette.primary, marginTop: 8 },
  reviewTitle: { color: palette.primary, fontWeight: '700' },
  screen: { flex: 1, backgroundColor: palette.background },
  secondaryBtn: {
    backgroundColor: '#F3F4F6',
    borderColor: palette.border,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 12,
  },
  secondaryBtnText: { color: palette.primary, fontWeight: '700' },
  sectionHeader: { marginTop: 16, marginBottom: 8 },
  sectionSub: { color: palette.muted, marginTop: 2 },
  sectionTitle: { color: palette.primary, fontWeight: '700', fontSize: 18 },
  star: { fontSize: 22, color: '#9CA3AF', marginRight: 4 },
  starActive: { color: '#F59E0B' },
  starsRow: { flexDirection: 'row', marginBottom: 8 },
  tagPill: { backgroundColor: '#F3F4F6', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, marginTop: 8 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 },
  tagText: { color: '#4B5563', fontWeight: '600', fontSize: 12 },
  title: { color: palette.primary, fontSize: 22, fontWeight: '800' },
});
