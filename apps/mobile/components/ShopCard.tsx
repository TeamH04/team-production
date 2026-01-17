import { BORDER_RADIUS, formatRating, SPACING } from '@team/constants';
import { BUDGET_LABEL, type Shop } from '@team/shop-core';
import { Image } from 'expo-image';
import { memo } from 'react';
import {
  Image as RNImage,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { palette } from '@/constants/palette';

/**
 * ShopCard の表示バリエーション
 * - 'large': 縦型レイアウト（画像が上、コンテンツが下）- HomeScreen 用
 * - 'compact': 横型レイアウト（画像が左、コンテンツが右）- Search/Favorites 用
 */
export type ShopCardVariant = 'large' | 'compact';

export interface ShopCardProps {
  /** 店舗データ */
  shop: Shop;
  /** カード押下時のコールバック */
  onPress: (shopId: string) => void;
  /** 表示バリエーション（デフォルト: 'compact'） */
  variant?: ShopCardVariant;
  /** カスタムスタイル */
  style?: StyleProp<ViewStyle>;
  /** メタ情報のフォーマットをカスタマイズ（デフォルトは標準フォーマット） */
  formatMeta?: (shop: Shop) => string;
}

/**
 * 店舗カードの共通コンポーネント
 *
 * HomeScreen, SearchScreen, FavoritesScreen で使用される店舗カードを統一
 */
function ShopCardComponent({
  shop,
  onPress,
  variant = 'compact',
  style,
  formatMeta,
}: ShopCardProps) {
  const handlePress = () => {
    onPress(shop.id);
  };

  const metaText =
    formatMeta?.(shop) ??
    `${shop.category} • 徒歩${shop.distanceMinutes}分 • 予算 ${BUDGET_LABEL[shop.budget]}`;

  if (variant === 'large') {
    return (
      <View style={[styles.largeShadow, style]}>
        <Pressable onPress={handlePress} style={styles.largeContainer}>
          <Image contentFit='cover' source={{ uri: shop.imageUrl }} style={styles.largeImage} />

          <View style={styles.largeBody}>
            <View style={styles.header}>
              <Text style={styles.largeTitle} numberOfLines={1}>
                {shop.name}
              </Text>
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingText}>{`★ ${formatRating(shop.rating)}`}</Text>
              </View>
            </View>

            <View style={styles.largeMetaRow}>
              <Text style={styles.metaText}>{shop.category}</Text>
              <Text style={styles.metaSeparator}>│</Text>
              <Text style={styles.metaText}>{`徒歩${shop.distanceMinutes}分`}</Text>
              <Text style={styles.metaSeparator}>│</Text>
              <Text style={styles.metaText}>{`予算 ${BUDGET_LABEL[shop.budget]}`}</Text>
            </View>

            <Text style={styles.largeDescription} numberOfLines={2}>
              {shop.description}
            </Text>
          </View>
        </Pressable>
      </View>
    );
  }

  // compact variant
  return (
    <Pressable onPress={handlePress} style={[styles.compactCard, style]}>
      <RNImage source={{ uri: shop.imageUrl }} style={styles.compactImage} />
      <View style={styles.compactInfo}>
        <View style={styles.compactHeader}>
          <Text style={styles.compactName}>{shop.name}</Text>
          <View style={styles.compactRatingBadge}>
            <Text style={styles.compactRatingText}>{`★ ${formatRating(shop.rating)}`}</Text>
          </View>
        </View>
        <Text style={styles.compactMeta}>{metaText}</Text>
        <Text style={styles.compactDescription} numberOfLines={2}>
          {shop.description}
        </Text>
      </View>
    </Pressable>
  );
}

export const ShopCard = memo(ShopCardComponent);

const styles = StyleSheet.create({
  // Compact variant styles (Search/Favorites)
  compactCard: {
    backgroundColor: palette.surface,
    borderColor: palette.divider,
    borderRadius: BORDER_RADIUS.LARGE,
    borderWidth: 1,
    elevation: 2,
    flexDirection: 'row',
    marginBottom: SPACING.MD,
    overflow: 'hidden',
    shadowColor: palette.shadow,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.05,
    shadowRadius: SPACING.XS,
  },
  compactDescription: {
    color: palette.secondaryText,
    fontSize: 12,
    lineHeight: 16,
  },
  compactHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.XS,
  },
  compactImage: {
    height: 100,
    width: 100,
  },
  compactInfo: {
    flex: 1,
    padding: SPACING.MD,
  },
  compactMeta: {
    color: palette.secondaryText,
    fontSize: 12,
    marginBottom: SPACING.XS,
  },
  compactName: {
    color: palette.primaryText,
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  compactRatingBadge: {
    backgroundColor: palette.highlight,
    borderRadius: BORDER_RADIUS.PILL,
    marginLeft: SPACING.SM,
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
  },
  compactRatingText: {
    color: palette.ratingText,
    fontSize: 11,
    fontWeight: '600',
  },

  // Large variant styles (Home)
  header: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  largeBody: {
    paddingHorizontal: SPACING.XL,
    paddingVertical: SPACING.XL,
  },
  largeContainer: {
    backgroundColor: palette.surface,
    borderColor: palette.divider,
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
  },
  largeDescription: {
    color: palette.tertiaryText,
    fontSize: 14,
    lineHeight: 20,
    marginTop: SPACING.MD,
  },
  largeImage: {
    height: 176,
    width: '100%',
  },
  largeMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: SPACING.MD,
  },
  largeShadow: {
    elevation: 5,
    marginBottom: SPACING.XL,
    shadowColor: palette.shadow,
    shadowOffset: { height: SPACING.SM, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: SPACING.LG,
  },
  largeTitle: {
    color: palette.primaryText,
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    marginRight: SPACING.MD,
  },
  metaSeparator: {
    color: palette.divider,
    fontSize: 13,
    marginHorizontal: 6,
  },
  metaText: {
    color: palette.secondaryText,
    fontSize: 13,
  },
  ratingBadge: {
    backgroundColor: palette.highlight,
    borderRadius: BORDER_RADIUS.PILL,
    paddingHorizontal: SPACING.MD,
    paddingVertical: 6,
  },
  ratingText: {
    color: palette.ratingText,
    fontSize: 13,
    fontWeight: '600',
  },
});
