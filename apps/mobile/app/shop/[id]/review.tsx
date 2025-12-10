import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useLayoutEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useReviews } from '@/features/reviews/ReviewsContext';
import { SHOPS } from '@team/shop-core';

// カラー定義（画面の配色をまとめて管理）
const palette = {
  accent: '#0EA5E9',
  background: '#F9FAFB',
  border: '#E5E7EB',
  error: '#DC2626',
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

// レビュー投稿画面のコンポーネント
export default function ReviewModalScreen() {
  // URLパラメータから店舗IDを取得
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter(); // 画面遷移用
  const navigation = useNavigation();
  const { addReview } = useReviews(); // レビュー追加関数

  // 店舗情報を取得
  const shop = useMemo(() => SHOPS.find(s => s.id === id), [id]);
  const menu = shop?.menu ?? [];

  // ヘッダータイトルを設定
  useLayoutEffect(() => {
    navigation.setOptions?.({
      title: 'レビュー',
      headerBackTitle: '戻る',
    });
  }, [navigation]);

  // ユーザー入力用のstate
  const [rating, setRating] = useState(0); // 評価（初期値0）
  const [comment, setComment] = useState(''); // コメント
  const [selectedMenuId, setSelectedMenuId] = useState<string | undefined>(undefined); // メニュー選択
  const [ratingError, setRatingError] = useState(false); // 評価エラー表示

  // 店舗が見つからない場合の表示
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

  // レビュー投稿画面の表示
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* 店舗名 */}
      <Text style={styles.heading}>{shop.name}</Text>
      {/* 評価（星） */}
      <Text style={styles.sectionLabel}>評価</Text>
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map(n => (
          <Pressable
            key={n}
            onPress={() => {
              setRating(n);
              setRatingError(false);
            }}
          >
            <Text style={[styles.star, n <= rating ? styles.starActive : undefined]}>★</Text>
          </Pressable>
        ))}
      </View>
      {ratingError && <Text style={styles.errorText}>※ 評価を選択してください</Text>}

      {/* メニュー選択（店舗にメニューがある場合のみ表示） */}
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

      {/* コメント入力欄 */}
      <Text style={styles.sectionLabel}>コメント</Text>
      <TextInput
        value={comment}
        onChangeText={setComment}
        placeholder='雰囲気・味・接客など自由に書いてください'
        placeholderTextColor={palette.muted}
        multiline
        style={styles.input}
      />

      {/* 投稿ボタン */}
      <Pressable
        style={styles.primaryBtn}
        onPress={() => {
          // バリデーション
          if (rating === 0) {
            setRatingError(true);
            return;
          }
          if (!comment.trim()) return; // コメントが空なら何もしない
          const selected = menu.find(m => m.id === selectedMenuId);
          addReview(shop.id, {
            rating,
            comment,
            menuItemId: selected?.id,
            menuItemName: selected?.name,
          });
          router.back(); // 投稿後に前の画面に戻る
        }}
      >
        <Text style={styles.primaryBtnText}>投稿する</Text>
      </Pressable>

      {/* キャンセルボタン */}
      <Pressable style={styles.secondaryBtn} onPress={() => router.back()}>
        <Text style={styles.secondaryBtnText}>キャンセル</Text>
      </Pressable>
    </ScrollView>
  );
}

// スタイル定義（見た目の調整）
const styles = StyleSheet.create({
  centered: { alignItems: 'center', justifyContent: 'center' }, // 中央寄せ
  content: { padding: 16 }, // 画面内余白
  errorText: { color: palette.error, fontSize: 14, marginTop: 4 }, // エラーメッセージ
  heading: { color: palette.primary, fontSize: 18, fontWeight: '800', marginBottom: 8 }, // 店舗名
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
    marginTop: 18,
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
