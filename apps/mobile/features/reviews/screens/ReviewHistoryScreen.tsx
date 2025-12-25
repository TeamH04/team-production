import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useFavorites } from '@/features/favorites/FavoritesContext';
import { useReviews } from '@/features/reviews/ReviewsContext';
import { SHOPS } from '@team/shop-core';

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

const TAB_BAR_SPACING = 125;

type TabType = 'favorites' | 'history' | 'likes' | 'preferences';

export default function ReviewHistoryScreen() {
  const router = useRouter();
  const { favorites } = useFavorites();
  const { reviewsByShop } = useReviews();
  const [activeTab, setActiveTab] = useState<TabType>('history');

  // お気に入り店舗の数
  const favoritesCount = favorites.size;

  // 全レビューの数
  const reviewsCount = useMemo(() => {
    return Object.values(reviewsByShop).flat().length;
  }, [reviewsByShop]);

  // 各タブのコンテンツを描画
  const renderTabContent = () => {
    switch (activeTab) {
      case 'favorites':
        return (
          <View>
            <Text style={styles.tabTitle}>お気に入り</Text>
            {favoritesCount === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>お気に入りがありません</Text>
              </View>
            ) : (
              <View style={styles.cardShadow}>
                <View style={styles.card}>
                  <Text style={styles.cardContent}>{favoritesCount}件のお気に入り</Text>
                </View>
              </View>
            )}
          </View>
        );

      case 'history':
        return (
          <View>
            <Text style={styles.tabTitle}>レビュー履歴</Text>
            {reviewsCount === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>レビューがありません</Text>
              </View>
            ) : (
              <View style={styles.cardShadow}>
                <View style={styles.card}>
                  <Text style={styles.cardContent}>{reviewsCount}件のレビュー</Text>
                </View>
              </View>
            )}
          </View>
        );

      case 'likes':
        return (
          <View>
            <Text style={styles.tabTitle}>いいねしたレビュー</Text>
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>いいねしたレビューがありません</Text>
            </View>
          </View>
        );

      case 'preferences':
        return (
          <View>
            <Text style={styles.tabTitle}>好みチェック</Text>
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>チェックした好みがありません</Text>
            </View>
          </View>
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
          style={[
            styles.tabButton,
            activeTab === 'favorites' && styles.tabButtonActive,
          ]}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'favorites' && styles.tabButtonTextActive,
            ]}
          >
            ❤️ お気に入り
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('history')}
          style={[
            styles.tabButton,
            activeTab === 'history' && styles.tabButtonActive,
          ]}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'history' && styles.tabButtonTextActive,
            ]}
          >
            ✏️ レビュー履歴
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('likes')}
          style={[
            styles.tabButton,
            activeTab === 'likes' && styles.tabButtonActive,
          ]}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'likes' && styles.tabButtonTextActive,
            ]}
          >
            👍 いいね
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('preferences')}
          style={[
            styles.tabButton,
            activeTab === 'preferences' && styles.tabButtonActive,
          ]}
        >
          <Text
            style={[
              styles.tabButtonText,
              activeTab === 'preferences' && styles.tabButtonTextActive,
            ]}
          >
            ✓ 好み
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
