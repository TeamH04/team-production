import { Image } from 'expo-image';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useLayoutEffect, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useFavorites } from '@/features/favorites/FavoritesContext';
import { SHOPS, type Shop } from '@/features/home/data/shops';
import { useReviews } from '@/features/reviews/ReviewsContext';

const palette = {
  accent: '#0EA5E9',
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

export default function ShopDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const navigation = useNavigation();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { getReviews } = useReviews();

  const shop = useMemo(() => SHOPS.find(s => s.id === id), [id]);

  useLayoutEffect(() => {
    if (shop) {
      navigation.setOptions?.({ title: shop.name, headerBackTitle: '戻る' });
    }
  }, [navigation, shop]);

  const isFav = id ? isFavorite(id) : false;
  const reviews = id ? getReviews(id) : [];

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
      <Image source={{ uri: shop.imageUrl }} style={styles.hero} contentFit='cover' />

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
            <View key={tag} style={styles.tagPill}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>レビュー</Text>
          <Text style={styles.sectionSub}>みんなの感想や体験談</Text>
        </View>

        <Pressable
          style={styles.primaryBtn}
          onPress={() => router.push({ pathname: '/shop/[id]/review', params: { id: shop.id } })}
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
              <Text style={styles.reviewBody}>{review.comment}</Text>
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
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  centered: { alignItems: 'center', justifyContent: 'center' },
  container: { padding: 16 },
  content: { paddingBottom: 24 },
  description: { color: palette.primary, lineHeight: 20, marginTop: 12 },
  favBtn: { marginLeft: 12 },
  favIcon: { color: palette.muted, fontSize: 24 },
  favIconActive: { color: palette.favoriteActive },
  headerRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  hero: { backgroundColor: palette.heroPlaceholder, height: 220, width: '100%' },
  meta: { color: palette.muted, marginTop: 6 },
  muted: { color: palette.muted },
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
});
