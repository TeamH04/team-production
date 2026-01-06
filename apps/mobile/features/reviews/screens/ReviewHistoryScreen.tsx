import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { TAB_BAR_SPACING } from '@/constants/TabBarSpacing';
import { useFavorites } from '@/features/favorites/FavoritesContext';
import { useReviews } from '@/features/reviews/ReviewsContext';

const palette = {
  accent: '#0EA5E9',
  background: '#F9FAFB',
  border: '#E5E7EB',
  mutedText: '#6B7280',
  primary: '#111827',
  primaryOnAccent: '#FFFFFF',
  secondarySurface: '#F3F4F6',
  shadow: '#0f172a',
  surface: '#FFFFFF',
} as const;

// TODO: 'preferences' タブ拡張実装を検討する場合に使用
type TabType = 'favorites' | 'history' | 'likes'; // | 'preferences';

export default function ReviewHistoryScreen() {
  const { favorites } = useFavorites();
  const { reviewsByShop, getLikedReviews } = useReviews();
  const [activeTab, setActiveTab] = useState<TabType>('history');

  // お気に入り店舗の数
  const favoritesCount = favorites.size;

  // 全レビューの数
  const reviewsCount = useMemo(() => {
    return Object.values(reviewsByShop).flat().length;
  }, [reviewsByShop]);

  // いいねしたレビューの数
  const likedReviewsCount = useMemo(() => {
    return getLikedReviews().length;
  }, [getLikedReviews]);

  /**
   * タブコンテンツの共通コンポーネント
   * @param title - タブのタイトル
   * @param emptyMessage - コンテンツが空の場合のメッセージ
   * @param content - 表示するコンテンツ（オプション）
   */
  const TabContent = ({
    title,
    emptyMessage,
    content,
  }: {
    title: string;
    emptyMessage: string;
    content?: React.ReactNode;
  }) => (
    <View>
      <Text style={styles.tabTitle}>{title}</Text>
      {!content ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        </View>
      ) : (
        <View style={styles.cardShadow}>
          <View style={styles.card}>{content}</View>
        </View>
      )}
    </View>
  );

  // 各タブのコンテンツを描画
  const renderTabContent = () => {
    switch (activeTab) {
      case 'favorites':
        return (
          <TabContent
            title='お気に入り'
            emptyMessage='お気に入りがありません'
            content={
              favoritesCount > 0 && (
                <Text style={styles.cardContent}>{favoritesCount}件のお気に入り</Text>
              )
            }
          />
        );

      case 'history':
        return (
          <TabContent
            title='レビュー履歴'
            emptyMessage='レビューがありません'
            content={
              reviewsCount > 0 && <Text style={styles.cardContent}>{reviewsCount}件のレビュー</Text>
            }
          />
        );

      case 'likes':
        return (
          <TabContent
            title='いいねしたレビュー'
            emptyMessage='いいねしたレビューがありません'
            content={
              likedReviewsCount > 0 && (
                <Text style={styles.cardContent}>{likedReviewsCount}件のいいね</Text>
              )
            }
          />
        );

      default:
        return null;
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* タブボタン */}
      <View style={styles.tabContainer}>
        <Pressable
          onPress={() => setActiveTab('favorites')}
          style={[styles.tabButton, activeTab === 'favorites' && styles.tabButtonActive]}
        >
          <Text
            style={[styles.tabButtonText, activeTab === 'favorites' && styles.tabButtonTextActive]}
          >
            ❤️ お気に入り
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('history')}
          style={[styles.tabButton, activeTab === 'history' && styles.tabButtonActive]}
        >
          <Text
            style={[styles.tabButtonText, activeTab === 'history' && styles.tabButtonTextActive]}
          >
            ✏️ レビュー履歴
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('likes')}
          style={[styles.tabButton, activeTab === 'likes' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabButtonText, activeTab === 'likes' && styles.tabButtonTextActive]}>
            👍 いいね
          </Text>
        </Pressable>
      </View>

      {/* 各タブのコンテンツ */}
      {renderTabContent()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderRadius: 20,
    padding: 16,
  },

  cardContent: {
    color: palette.primary,
    fontSize: 16,
    fontWeight: '600',
  },

  cardShadow: {
    elevation: 4,
    marginBottom: 16,
    marginTop: 16,
    shadowColor: palette.shadow,
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },

  content: {
    padding: 16,
    paddingBottom: TAB_BAR_SPACING,
  },

  emptyBox: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderRadius: 16,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 24,
  },

  emptyText: {
    color: palette.mutedText,
  },

  screen: {
    backgroundColor: palette.background,
    flex: 1,
  },

  tabButton: {
    borderBottomWidth: 0,
    flex: 1,
    paddingVertical: 12,
  },

  tabButtonActive: {
    borderBottomColor: palette.accent,
    borderBottomWidth: 3,
  },

  tabButtonText: {
    color: palette.mutedText,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  tabButtonTextActive: {
    color: palette.accent,
  },

  tabContainer: {
    borderBottomColor: palette.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    marginBottom: 16,
  },

  tabTitle: {
    color: palette.primary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
});
