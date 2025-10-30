import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { SHOPS } from '@/features/home/data/shops';
import { useReviews } from '@/features/reviews/ReviewsContext';

const palette = {
  accent: '#0EA5E9',
  background: '#F9FAFB',
  border: '#E5E7EB',
  menuBackground: '#F9FAFB',
  menuSelectedBackground: '#DBEAFE',
  menuSelectedBorder: '#93C5FD',
  menuSelectedText: '#1D4ED8',
  muted: '#6B7280',
  primary: '#111827',
  primaryOnAccent: '#FFFFFF',
  secondarySurface: '#F3F4F6',
  starHighlight: '#F59E0B',
  starInactive: '#9CA3AF',
  surface: '#FFFFFF',
} as const;

export default function ReviewModalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { addReview } = useReviews();

  const shop = useMemo(() => SHOPS.find(s => s.id === id), [id]);
  const menu = shop?.menu ?? [];

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [selectedMenuId, setSelectedMenuId] = useState<string | undefined>(undefined);

  if (!shop) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <Text style={styles.title}>店舗が見つかりませんでした</Text>
        <Pressable style={styles.secondaryBtn} onPress={() => router.back()}>
          <Text style={styles.secondaryBtnText}>閉じる</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>{shop.name}</Text>
      <Text style={styles.sectionLabel}>評価</Text>
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map(n => (
          <Pressable key={n} onPress={() => setRating(n)}>
            <Text style={[styles.star, n <= rating ? styles.starActive : undefined]}>★</Text>
          </Pressable>
        ))}
      </View>

      {menu.length > 0 ? (
        <View style={styles.menuSection}>
          <Text style={styles.sectionLabel}>メニュー</Text>
          <View style={styles.menuList}>
            {menu.map(m => {
              const selected = selectedMenuId === m.id;
              return (
                <Pressable
                  key={m.id}
                  onPress={() => setSelectedMenuId(m.id)}
                  style={[styles.menuItem, selected && styles.menuItemSelected]}
                >
                  <Text style={[styles.menuItemText, selected && styles.menuItemTextSelected]}>
                    {m.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.muted}>メニューは任意です。該当が無ければ未選択でOK。</Text>
        </View>
      ) : null}

      <Text style={styles.sectionLabel}>コメント</Text>
      <TextInput
        value={comment}
        onChangeText={setComment}
        placeholder='雰囲気・味・接客など自由に書いてください'
        placeholderTextColor={palette.muted}
        multiline
        style={styles.input}
      />

      <Pressable
        style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
        onPress={() => {
          if (!comment.trim()) return;
          const selected = menu.find(m => m.id === selectedMenuId);
          addReview(shop.id, {
            rating,
            comment,
            menuItemId: selected?.id,
            menuItemName: selected?.name,
          });
          router.back();
        }}
      >
        <Text style={styles.primaryBtnText}>投稿する</Text>
      </Pressable>

      <Pressable style={styles.secondaryBtn} onPress={() => router.back()}>
        <Text style={styles.secondaryBtnText}>キャンセル</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  btnPressed: { opacity: 0.9 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16 },
  heading: { color: palette.primary, fontSize: 18, fontWeight: '800', marginBottom: 8 },
  input: {
    backgroundColor: palette.background,
    borderColor: palette.border,
    borderRadius: 12,
    borderWidth: 1,
    color: palette.primary,
    minHeight: 100,
    padding: 12,
  },
  menuItem: {
    backgroundColor: palette.menuBackground,
    borderColor: palette.border,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  menuItemSelected: {
    backgroundColor: palette.menuSelectedBackground,
    borderColor: palette.menuSelectedBorder,
  },
  menuItemText: { color: palette.primary, fontWeight: '600' },
  menuItemTextSelected: { color: palette.menuSelectedText },
  menuList: { flexDirection: 'row', flexWrap: 'wrap' },
  menuSection: { marginTop: 12 },
  muted: { color: palette.muted, marginTop: 6 },
  primaryBtn: {
    backgroundColor: palette.accent,
    borderRadius: 12,
    marginTop: 16,
    paddingVertical: 12,
  },
  primaryBtnText: { color: palette.primaryOnAccent, fontWeight: '700', textAlign: 'center' },
  screen: { backgroundColor: palette.surface, flex: 1 },
  secondaryBtn: {
    backgroundColor: palette.secondarySurface,
    borderColor: palette.border,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  secondaryBtnText: { color: palette.primary, fontWeight: '700', textAlign: 'center' },
  sectionLabel: { color: palette.primary, fontWeight: '700', marginBottom: 8, marginTop: 12 },
  star: { color: palette.starInactive, fontSize: 22, marginRight: 4 },
  starActive: { color: palette.starHighlight },
  starsRow: { flexDirection: 'row', marginBottom: 8 },
  title: { color: palette.primary, fontSize: 18, fontWeight: '800' },
});
