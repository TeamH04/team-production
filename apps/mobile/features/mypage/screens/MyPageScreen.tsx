import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

import { useFavorites } from '@/features/favorites/FavoritesContext';
import { useReviews } from '@/features/reviews/ReviewsContext';
import { useUser } from '@/features/user/UserContext';
import { getCurrentUser } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';
import { getPublicStorageUrl } from '@/lib/storage';
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
} as const;

const TAB_BAR_SPACING = 125;

// マイページ画面のコンポーネント
export default function MyPageScreen() {
  // 画面遷移用
  const router = useRouter();

  // お気に入り店舗IDの一覧を取得
  const { favorites } = useFavorites();

  // 店舗ごとのレビュー一覧と取得関数を取得
  const { reviewsByShop, loadUserReviews } = useReviews();

  // ユーザー情報
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

  const handleReviewLogin = useCallback(async () => {
    const user = await getCurrentUser();
    if (!user) {
      router.push('/login');
    }
  }, [router]);

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
        // レビューが無い場合
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>まだレビューがありません</Text>
        </View>
      ) : (
        // レビュー一覧（1件ごとに改行を入れて見やすく）
        <View>
          {reviews.map(review => {
            const shop = SHOPS.find(s => s.id === review.shopId); // レビューの店舗情報取得

            return (
              <View key={review.id} style={styles.cardShadow}>
                <View style={styles.card}>
                  {/* レビューヘッダー */}
                  <View style={styles.reviewHeader}>
                    <Text style={styles.rowCardTitle}>{shop?.name ?? '不明な店舗'}</Text>
                    <View style={styles.likePill}>
                      <Text style={styles.likeText}>いいね {review.likesCount}</Text>
                    </View>
                  </View>

                  {/* レビューのメタ情報（評価・日付）と本文 */}
                  <Text style={styles.rowCardSub}>
                    ★ {review.rating} │ {new Date(review.createdAt).toLocaleDateString('ja-JP')}
                  </Text>

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
          })}
        </View>
      )}
    </ScrollView>
  );
}

// スタイル定義（見た目の調整）
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

  // 空状態表示（お気に入りやレビューが無い時）
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

  // ログアウトボタン
  logoutBtn: {
    alignSelf: 'flex-start',
    marginLeft: 'auto',
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  logoutText: { color: palette.accent, fontSize: 14, fontWeight: '600' },

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

  // レビューヘッダー（店舗名＋いいねの横並び）
  reviewHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },

  reviewImage: { borderRadius: 12, height: 88, width: 88 },
  reviewImages: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },

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
  secondaryBtnText: { color: palette.primary, fontWeight: '700', textAlign: 'center' },

  // セクションヘッダー（タイトル＋サブ）周り
  sectionHeader: { marginBottom: 8, marginTop: 8, paddingHorizontal: 4 },
  sectionSub: { color: palette.mutedText, fontSize: 13, marginTop: 2 },
  sectionTitle: { color: palette.primary, fontSize: 18, fontWeight: '700' },
});
