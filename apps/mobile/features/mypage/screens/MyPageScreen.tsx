import { useRouter } from 'expo-router';
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useReviews } from '@/features/reviews/ReviewsContext';
import { useUser } from '@/features/user/UserContext';
import { getSupabase } from '@/lib/supabase';
import { SHOPS } from '@team/shop-core';

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
export default function MyPageScreen({
  resetCount = 0,
  setWasDetailScreen,
}: {
  resetCount?: number;
  setWasDetailScreen?: (val: boolean) => void;
}) {
  // 画面遷移用
  const router = useRouter();

  // 店舗ごとのレビュー一覧と削除関数を取得
  const { reviewsByShop } = useReviews();

  // ユーザー情報
  const { profile } = useUser();

  // 全店舗のレビューを一つの配列にまとめ、新しい順で最大20件を返す
  const reviews = useMemo(() => {
    const all = Object.values(reviewsByShop).flat();
    return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 20);
  }, [reviewsByShop]);

  // ScrollView の参照
  const scrollRef = useRef<ScrollView>(null);
  const reviewHistoryScrollRef = useRef<ScrollView>(null);
  const settingsScrollRef = useRef<ScrollView>(null);
  const notificationsScrollRef = useRef<ScrollView>(null);

  // スクロール位置を保存
  const [scrollPosition, setScrollPosition] = useState(0);
  const [reviewHistoryScrollPosition, setReviewHistoryScrollPosition] = useState(0);
  const [settingsScrollPosition, setSettingsScrollPosition] = useState(0);
  const [notificationsScrollPosition, setNotificationsScrollPosition] = useState(0);

  // 各画面の表示状態
  const [showReviewHistory, setShowReviewHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // スクロール位置の変更を記録
  const handleScroll = (event: { nativeEvent: { contentOffset: { y: number } } }) => {
    setScrollPosition(event.nativeEvent.contentOffset.y);
  };

  const handleReviewHistoryScroll = (event: { nativeEvent: { contentOffset: { y: number } } }) => {
    setReviewHistoryScrollPosition(event.nativeEvent.contentOffset.y);
  };

  const handleSettingsScroll = (event: { nativeEvent: { contentOffset: { y: number } } }) => {
    setSettingsScrollPosition(event.nativeEvent.contentOffset.y);
  };

  const handleNotificationsScroll = (event: { nativeEvent: { contentOffset: { y: number } } }) => {
    setNotificationsScrollPosition(event.nativeEvent.contentOffset.y);
  };

  // マイページに戻ったときにスクロール位置を復元
  useLayoutEffect(() => {
    if (!showReviewHistory && !showSettings && !showNotifications && scrollRef.current) {
      scrollRef.current.scrollTo({ y: scrollPosition, animated: false });
    }
  }, [showReviewHistory, showSettings, showNotifications, scrollPosition]);

  // レビュー履歴を表示するときにスクロール位置を復元
  useLayoutEffect(() => {
    if (showReviewHistory && reviewHistoryScrollRef.current) {
      reviewHistoryScrollRef.current.scrollTo({ y: reviewHistoryScrollPosition, animated: false });
    }
  }, [showReviewHistory, reviewHistoryScrollPosition]);

  // 設定を表示するときにスクロール位置を復元
  useLayoutEffect(() => {
    if (showSettings && settingsScrollRef.current) {
      settingsScrollRef.current.scrollTo({ y: settingsScrollPosition, animated: false });
    }
  }, [showSettings, settingsScrollPosition]);

  // お知らせを表示するときにスクロール位置を復元
  useLayoutEffect(() => {
    if (showNotifications && notificationsScrollRef.current) {
      notificationsScrollRef.current.scrollTo({ y: notificationsScrollPosition, animated: false });
    }
  }, [showNotifications, notificationsScrollPosition]);

  // 詳細画面が表示されたことを通知
  useLayoutEffect(() => {
    if ((showReviewHistory || showSettings || showNotifications) && setWasDetailScreen) {
      setWasDetailScreen(true);
    }
  }, [showReviewHistory, showSettings, showNotifications, setWasDetailScreen]);

  useLayoutEffect(() => {
    if (resetCount > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowReviewHistory(false);
      setShowSettings(false);
      setShowNotifications(false);
    }
  }, [resetCount]);

  const handleLogout = useCallback(async () => {
    try {
      await getSupabase().auth.signOut();
      router.replace('/login');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert('ログアウトに失敗しました', message);
    }
  }, [router]);

  // 画面の描画
  return (
    <>
      {/* レビュー履歴表示時 */}
      {showReviewHistory ? (
        <ScrollView
          ref={reviewHistoryScrollRef}
          onScroll={handleReviewHistoryScroll}
          scrollEventThrottle={16}
          style={styles.screen}
          contentContainerStyle={styles.content}
        >
          {/* レビュー履歴ヘッダー */}
          <View style={styles.headerContainer}>
            <Pressable
              onPress={() => {
                setShowReviewHistory(false);
                setShowSettings(false);
                setShowNotifications(false);
              }}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>←</Text>
            </Pressable>
            <Text style={styles.headerTitle}>レビュー履歴</Text>
            <View style={styles.spacer} />
          </View>

          {reviews.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>まだレビューがありません</Text>
            </View>
          ) : (
            <View>
              {reviews.map(review => {
                const shop = SHOPS.find(s => s.id === review.shopId);
                return (
                  <Pressable
                    key={review.id}
                    style={styles.cardShadow}
                    onPress={() => router.push(`/shop/${review.shopId}`)}
                  >
                    <View style={styles.card}>
                      <View style={styles.reviewCardContent}>
                        {shop?.imageUrl && (
                          <Image source={{ uri: shop.imageUrl }} style={styles.reviewImage} />
                        )}
                        <View style={styles.reviewTextContainer}>
                          <View style={styles.reviewHeader}>
                            <View style={styles.shopInfo}>
                              <Text style={styles.shopName}>{shop?.name ?? '不明な店舗'}</Text>
                              <Text style={styles.shopCategory}>
                                {shop?.category} │ ★ {shop?.rating.toFixed(1)}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.reviewMeta}>
                            <Text style={styles.rating}>★ {review.rating}</Text>
                            <Text style={styles.date}>
                              {new Date(review.createdAt).toLocaleDateString('ja-JP')}
                            </Text>
                          </View>

                          {review.menuItemName && (
                            <Text style={styles.menuItem}>メニュー: {review.menuItemName}</Text>
                          )}

                          {review.comment && <Text style={styles.comment}>{review.comment}</Text>}
                        </View>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>
      ) : showNotifications ? (
        <ScrollView
          ref={notificationsScrollRef}
          onScroll={handleNotificationsScroll}
          scrollEventThrottle={16}
          style={styles.screen}
          contentContainerStyle={styles.content}
        >
          {/* お知らせヘッダー */}
          <View style={styles.headerContainer}>
            <Pressable
              onPress={() => {
                setShowReviewHistory(false);
                setShowSettings(false);
                setShowNotifications(false);
              }}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>←</Text>
            </Pressable>
            <Text style={styles.headerTitle}>お知らせ</Text>
            <View style={styles.spacer} />
          </View>

          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>お知らせはありません</Text>
          </View>
        </ScrollView>
      ) : showSettings ? (
        <ScrollView
          ref={settingsScrollRef}
          onScroll={handleSettingsScroll}
          scrollEventThrottle={16}
          style={styles.screen}
          contentContainerStyle={styles.content}
        >
          {/* 設定ヘッダー */}
          <View style={styles.headerContainer}>
            <Pressable
              onPress={() => {
                setShowReviewHistory(false);
                setShowSettings(false);
                setShowNotifications(false);
              }}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>←</Text>
            </Pressable>
            <Text style={styles.headerTitle}>設定</Text>
            <View style={styles.spacer} />
          </View>

          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>設定オプションはまもなく追加されます</Text>
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          ref={scrollRef}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.screen}
          contentContainerStyle={styles.content}
        >
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

          {/* あなたの記録セクション */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>―― あなたの記録 ――</Text>
            <View style={styles.gridContainer}>
              <Pressable style={styles.gridCard} onPress={() => router.push('/(tabs)/favorites')}>
                <Text style={styles.gridCardIcon}>❤️</Text>
                <Text style={styles.gridCardLabel}>お気に入り</Text>
              </Pressable>

              <Pressable style={styles.gridCard} onPress={() => setShowReviewHistory(true)}>
                <Text style={styles.gridCardIcon}>📝</Text>
                <Text style={styles.gridCardLabel}>レビュー履歴</Text>
              </Pressable>

              <Pressable style={styles.gridCard}>
                <Text style={styles.gridCardIcon}>👍</Text>
                <Text style={styles.gridCardLabel}>いいねしたレビュー</Text>
              </Pressable>

              <Pressable style={styles.gridCard}>
                <Text style={styles.gridCardIcon}>✓</Text>
                <Text style={styles.gridCardLabel}>好みチェック</Text>
              </Pressable>
            </View>
          </View>

          {/* 設定セクション */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>―― 設定 ――</Text>
            <View style={styles.gridContainer}>
              <Pressable style={styles.gridCard} onPress={() => setShowNotifications(true)}>
                <Text style={styles.gridCardIcon}>🔔</Text>
                <Text style={styles.gridCardLabel}>お知らせ</Text>
              </Pressable>

              <Pressable style={styles.gridCard} onPress={() => setShowSettings(true)}>
                <Text style={styles.gridCardIcon}>⚙️</Text>
                <Text style={styles.gridCardLabel}>設定</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      )}
    </>
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
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 50,
  },
  backButtonText: {
    color: palette.accent,
    fontSize: 28,
    fontWeight: '700',
  },
  card: { backgroundColor: palette.surface, borderRadius: 20, padding: 12 },
  cardShadow: {
    elevation: 4,
    marginBottom: 16,
    shadowColor: palette.shadow,
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  comment: {
    color: palette.primary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  content: { padding: 16, paddingBottom: TAB_BAR_SPACING },
  date: {
    color: palette.mutedText,
    fontSize: 11,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: { color: palette.mutedText },
  gridCard: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderRadius: 16,
    elevation: 2,
    justifyContent: 'center',
    marginBottom: 12,
    paddingVertical: 24,
    shadowColor: palette.shadow,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    width: '48%',
  },
  gridCardIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  gridCardLabel: {
    color: palette.primary,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  gridContainer: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  headerContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerTitle: {
    color: palette.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  logoutBtn: {
    alignSelf: 'flex-start',
    marginLeft: 'auto',
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  logoutText: { color: palette.accent, fontSize: 14, fontWeight: '600' },
  menuItem: {
    color: palette.mutedText,
    fontSize: 11,
    marginTop: 4,
  },
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
  profileMeta: { flex: 1, marginLeft: 14 },
  profileName: { color: palette.primary, fontSize: 18, fontWeight: '700' },
  profileRow: { alignItems: 'center', flexDirection: 'row' },
  profileSub: { color: palette.mutedText, marginTop: 4 },
  rating: {
    color: palette.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  reviewCardContent: {
    flexDirection: 'row',
    gap: 10,
  },
  reviewHeader: {
    marginBottom: 4,
  },
  reviewImage: {
    borderRadius: 8,
    height: 100,
    marginRight: 12,
    width: 100,
  },
  reviewMeta: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 2,
  },
  reviewTextContainer: {
    flex: 1,
  },
  screen: { backgroundColor: palette.background, flex: 1 },
  sectionContainer: {
    marginTop: 24,
  },
  sectionTitle: {
    color: palette.primary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  shopCategory: {
    color: palette.mutedText,
    fontSize: 11,
    marginTop: 2,
  },
  shopInfo: {
    flex: 1,
  },
  shopName: {
    color: palette.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  spacer: {
    width: 40,
  },
});
