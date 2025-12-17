import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useFavorites } from '@/features/favorites/FavoritesContext';
import { useReviews } from '@/features/reviews/ReviewsContext';
import { useUser } from '@/features/user/UserContext';
import { getSupabase } from '@/lib/supabase';
import { SHOPS, type Shop } from '@team/shop-core';

// 画面で使う色をまとめて管理
const palette = {
  accent: '#0EA5E9',
  avatarBackground: '#DBEAFE',
  avatarText: '#1D4ED8',
  background: '#F9FAFB',
  border: '#E5E7EB',
  mutedText: '#6B7280',
  primary: '#111827',
  primaryOnAccent: '#FFFFFF',
  secondarySurface: '#F3F4F6',
  shadow: '#0f172a',
  surface: '#FFFFFF',
  dangerBg: '#DC2626',
  dangerBorder: '#B91C1C',
  dangerText: '#FFFFFF',
} as const;

const TAB_BAR_SPACING = 125;

// マイページ画面のコンポーネント
export default function MyPageScreen() {
  // 画面遷移用
  const router = useRouter();

  // お気に入り店舗IDの一覧を取得
  const { favorites } = useFavorites();

  // 店舗ごとのレビュー一覧と削除関数を取得
  const { reviewsByShop, deleteReview } = useReviews();

  // ユーザー情報
  const { profile } = useUser();

  // お気に入り店舗の情報を配列で作る（表示用）
  const favoriteShops = useMemo<Shop[]>(() => {
    const ids = Array.from(favorites); // set を配列に変換
    return SHOPS.filter(shop => ids.includes(shop.id)); // お気に入りIDに該当する店舗のみ抽出
  }, [favorites]);

  // 全店舗のレビューを一つの配列にまとめ、新しい順で最大20件を返す
  const reviews = useMemo(() => {
    const all = Object.values(reviewsByShop).flat();
    return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 20);
  }, [reviewsByShop]);

  const handleLogout = useCallback(async () => {
    try {
      await getSupabase().auth.signOut();
      router.replace('/login');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert('ログアウトに失敗しました', message);
    }
  }, [router]);

  // どのレビューが展開（編集/削除ボタンが見える状態）か管理する
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null);

  // 画面の描画
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* ユーザー情報カード */}
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

      {/* お気に入り店舗セクション */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>お気に入り店舗</Text>
        <Text style={styles.sectionSub}>ブックマークしたお店の一覧</Text>
      </View>

      {favoriteShops.length === 0 ? (
        // お気に入りがない場合の表示
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>まだお気に入りがありません</Text>
        </View>
      ) : (
        // お気に入り店舗一覧
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
                {/* 詳細ボタン */}
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

      {/* レビュー履歴セクション */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>レビュー投稿履歴</Text>
        <Text style={styles.sectionSub}>最近投稿したレビュー</Text>
      </View>

      {reviews.length === 0 ? (
        // レビューが無い場合
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>まだレビューがありません</Text>
        </View>
      ) : (
        // レビュー一覧（1件ごとに改行を入れて見やすく）
        <View>
          {reviews.map(review => {
            const shop = SHOPS.find(s => s.id === review.shopId); // レビューの店舗情報取得
            const isExpanded = expandedReviewId === review.id; // このレビューが展開中かどうか

            return (
              <View key={review.id} style={styles.cardShadow}>
                <View style={styles.card}>
                  {/* レビューヘッダー（店舗名 ＋ メニューボタン） */}
                  <View style={styles.reviewHeader}>
                    <Text style={styles.rowCardTitle}>{shop?.name ?? '不明な店舗'}</Text>

                    <Pressable
                      onPress={() => setExpandedReviewId(isExpanded ? null : review.id)}
                      style={styles.menuBtn}
                    >
                      <Text style={styles.menuBtnText}>･･･</Text>
                    </Pressable>
                  </View>

                  {/* レビューのメタ情報（評価・日付）と本文 */}
                  <Text style={styles.rowCardSub}>
                    ★ {review.rating} │ {new Date(review.createdAt).toLocaleDateString('ja-JP')}
                  </Text>

                  {review.menuItemName ? (
                    <Text style={styles.rowCardSub}>メニュー: {review.menuItemName}</Text>
                  ) : null}

                  {review.comment ? <Text style={styles.reviewText}>{review.comment}</Text> : null}

                  {/* レビューフッター（編集・削除のアクション：展開時のみ表示） */}
                  {isExpanded ? (
                    <View style={styles.reviewFooter}>
                      <Pressable
                        onPress={() => {
                          // 編集機能は未実装のため、"coming soon" メッセージを表示
                          Alert.alert('編集中', '編集機能は近日公開予定です');
                        }}
                        style={[styles.primaryBtn, styles.reviewFooterPrimaryBtn]}
                      >
                        <Text style={styles.primaryBtnText}>編集</Text>
                      </Pressable>

                      <Pressable
                        onPress={() =>
                          Alert.alert('削除の確認', 'このレビューを削除してもよいですか？', [
                            { text: 'キャンセル', style: 'cancel' },
                            {
                              text: '削除',
                              style: 'destructive',
                              onPress: () => {
                                deleteReview(review.id);
                                setExpandedReviewId(null);
                              },
                            },
                          ])
                        }
                        style={[styles.commonBtn, styles.deleteBtn]}
                      >
                        <Text style={[styles.commonBtnText, styles.deleteBtnText]}>削除</Text>
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

// スタイル定義（見た目の調整）
const styles = StyleSheet.create({
  // Avatar（ユーザーアイコン）周りのスタイル
  avatar: {
    alignItems: 'center',
    backgroundColor: palette.avatarBackground,
    borderRadius: 999,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  avatarText: { color: palette.avatarText, fontSize: 22, fontWeight: '800' },

  // 押下時の共通フィードバック
  btnPressed: { opacity: 0.9 },

  // カード全般の見た目（白背景・角丸・余白）
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

  // 共通ボタンの基本スタイル（編集・削除 等で共用）
  commonBtn: {
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  commonBtnText: { fontWeight: '700', textAlign: 'center' },

  // レイアウト全体の余白
  content: { padding: 16, paddingBottom: 24 },

  // 削除ボタン固有の色など
  deleteBtn: {
    backgroundColor: palette.dangerBg,
    borderColor: palette.dangerBorder,
  },
  deleteBtnText: { color: palette.dangerText },

  // 空状態表示（お気に入りやレビューが無い時）
  emptyBox: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  emptyText: { color: palette.mutedText },

  // ログアウトボタン
  logoutBtn: {
    alignSelf: 'flex-start',
    marginLeft: 'auto',
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  logoutText: { color: palette.accent, fontSize: 14, fontWeight: '600' },

  // 小さなメニューボタン（レビュー右上の「･･･」）
  menuBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  menuBtnText: { color: palette.mutedText, fontSize: 18, fontWeight: '700' },

  // プライマリボタン（プロフィール編集 等）
  primaryBtn: {
    backgroundColor: palette.accent,
    borderRadius: 12,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryBtnText: {
    color: palette.primaryOnAccent,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },

  // プロフィール領域のレイアウト
  profileMeta: { flex: 1, marginLeft: 14 },
  profileName: { color: palette.primary, fontSize: 18, fontWeight: '700' },
  profileRow: { alignItems: 'center', flexDirection: 'row' },
  profileSub: { color: palette.mutedText, marginTop: 4 },

  // レビューフッター（編集・削除ボタンを横並びで配置）
  reviewFooter: { alignItems: 'center', flexDirection: 'row', marginTop: 12 },
  reviewFooterPrimaryBtn: { flex: 1, marginRight: 12, marginTop: 0 },

  // レビューヘッダー（店舗名＋メニューボタンの横並び）
  reviewHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },

  // レビュー本文まわり
  reviewText: { color: palette.primary, marginTop: 8 },

  // カードの行レイアウト（店舗一覧行など）
  rowCard: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  rowCardMeta: { flex: 1, paddingRight: 12 },
  rowCardSub: { color: palette.mutedText, marginTop: 4 },
  rowCardTitle: { color: palette.primary, fontSize: 16, fontWeight: '700' },

  // スクリーン全体の背景
  screen: { backgroundColor: palette.background, flex: 1 },

  // セカンダリボタン（詳細ボタン 等）
  secondaryBtn: {
    backgroundColor: palette.secondarySurface,
    borderColor: palette.border,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  secondaryBtnText: { color: palette.primary, fontWeight: '700' },

  // セクションヘッダー（タイトル＋サブ）周り
  sectionHeader: { marginBottom: 8, marginTop: 8, paddingHorizontal: 4 },
  sectionSub: { color: palette.mutedText, fontSize: 13, marginTop: 2 },
  sectionTitle: { color: palette.primary, fontSize: 18, fontWeight: '700' },
});
