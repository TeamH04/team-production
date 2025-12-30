import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { palette } from '@/constants/palette';
import { TAB_BAR_SPACING } from '@/constants/TabBarSpacing';
import { useReviews } from '@/features/reviews/ReviewsContext';
import { useUser } from '@/features/user/UserContext';
import { getSupabase } from '@/lib/supabase';
import { SHOPS } from '@team/shop-core';

/**
 * マイページ画面コンポーネント
 * ユーザープロフィール、レビュー履歴、設定を表示します
 * @param setWasDetailScreen - 詳細画面が表示されたことを通知するコールバック
 */
export default function MyPageScreen({
  setWasDetailScreen,
}: {
  setWasDetailScreen?: (val: boolean) => void;
}) {
  // 画面遷移用
  const router = useRouter();

  // 店舗ごとのレビュー一覧を取得
  const { reviewsByShop } = useReviews();

  // ユーザー情報
  const { profile } = useUser();

  // 全店舗のレビューを一つの配列にまとめ、新しい順で最大20件を返す
  const reviews = useMemo(() => {
    const all = Object.values(reviewsByShop).flat();
    return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 20);
  }, [reviewsByShop]);

  // 表示画面の種類を定義（Union 型で管理）
  type ScreenType = 'main' | 'reviewHistory' | 'settings' | 'notifications';

  // ScrollView の参照（コンポーネントトップレベルで定義）
  const mainScrollRef = useRef<ScrollView>(null);
  const reviewHistoryScrollRef = useRef<ScrollView>(null);
  const settingsScrollRef = useRef<ScrollView>(null);
  const notificationsScrollRef = useRef<ScrollView>(null);

  // 現在表示している画面を管理（Union 型で一元管理）
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('main');

  /**
   * スクロールハンドラーのマップ
   * 各画面のスクロール位置を記録します
   */
  const scrollHandlers = {
    main: useCallback(() => {}, []),
    reviewHistory: useCallback(() => {}, []),
    settings: useCallback(() => {}, []),
    notifications: useCallback(() => {}, []),
  };

  const handleScroll = scrollHandlers.main;
  const handleReviewHistoryScroll = scrollHandlers.reviewHistory;
  const handleSettingsScroll = scrollHandlers.settings;
  const handleNotificationsScroll = scrollHandlers.notifications;

  const handleBackPress = useCallback(() => {
    setCurrentScreen('main');
    if (setWasDetailScreen) {
      setWasDetailScreen(false);
    }
  }, [setWasDetailScreen]);

  const handleLogout = useCallback(async () => {
    try {
      await getSupabase().auth.signOut();
      router.replace('/login');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert('ログアウトに失敗しました', message);
    }
  }, [router]);

  // 詳細画面へのナビゲーション
  const handleGoToReviewHistory = useCallback(() => {
    setCurrentScreen('reviewHistory');
    if (setWasDetailScreen) {
      setWasDetailScreen(true);
    }
  }, [setWasDetailScreen]);

  const handleGoToSettings = useCallback(() => {
    setCurrentScreen('settings');
    if (setWasDetailScreen) {
      setWasDetailScreen(true);
    }
  }, [setWasDetailScreen]);

  const handleGoToNotifications = useCallback(() => {
    setCurrentScreen('notifications');
    if (setWasDetailScreen) {
      setWasDetailScreen(true);
    }
  }, [setWasDetailScreen]);

  // 画面の描画（switch 文で管理）
  switch (currentScreen) {
    case 'reviewHistory':
      return (
        <ScrollView
          ref={reviewHistoryScrollRef}
          onScroll={handleReviewHistoryScroll}
          scrollEventThrottle={16}
          style={styles.screen}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* レビュー履歴ヘッダー */}
          <View style={styles.headerContainer}>
            <Pressable onPress={handleBackPress} style={styles.backButton}>
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
      );

    case 'notifications':
      return (
        <ScrollView
          ref={notificationsScrollRef}
          onScroll={handleNotificationsScroll}
          scrollEventThrottle={16}
          style={styles.screen}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* お知らせヘッダー */}
          <View style={styles.headerContainer}>
            <Pressable onPress={handleBackPress} style={styles.backButton}>
              <Text style={styles.backButtonText}>←</Text>
            </Pressable>
            <Text style={styles.headerTitle}>お知らせ</Text>
            <View style={styles.spacer} />
          </View>

          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>お知らせはありません</Text>
          </View>
        </ScrollView>
      );

    case 'settings':
      return (
        <ScrollView
          ref={settingsScrollRef}
          onScroll={handleSettingsScroll}
          scrollEventThrottle={16}
          style={styles.screen}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* 設定ヘッダー */}
          <View style={styles.headerContainer}>
            <Pressable onPress={handleBackPress} style={styles.backButton}>
              <Text style={styles.backButtonText}>←</Text>
            </Pressable>
            <Text style={styles.headerTitle}>設定</Text>
            <View style={styles.spacer} />
          </View>

          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>設定オプションはまもなく追加されます</Text>
          </View>
        </ScrollView>
      );

    case 'main':
    default:
      return (
        <ScrollView
          ref={mainScrollRef}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.screen}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
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

              <Pressable style={styles.gridCard} onPress={handleGoToReviewHistory}>
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
              <Pressable style={styles.gridCard} onPress={handleGoToNotifications}>
                <Text style={styles.gridCardIcon}>🔔</Text>
                <Text style={styles.gridCardLabel}>お知らせ</Text>
              </Pressable>

              <Pressable style={styles.gridCard} onPress={handleGoToSettings}>
                <Text style={styles.gridCardIcon}>⚙️</Text>
                <Text style={styles.gridCardLabel}>設定</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      );
  }
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

  sectionTitle: { color: palette.primary, fontSize: 18, fontWeight: '700' },
  spacer: {
    width: 50,
  },
});
