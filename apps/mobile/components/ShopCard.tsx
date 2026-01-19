import { Ionicons } from '@expo/vector-icons';
import { BORDER_RADIUS, LAYOUT, SPACING } from '@team/constants';
import { palette, type ShopCardVariant } from '@team/mobile-ui';
import { BUDGET_LABEL, type Shop } from '@team/shop-core';
import { Image } from 'expo-image';
import { memo } from 'react';
import {
  Pressable,
  Image as RNImage,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { fonts } from '@/constants/typography';

// カードStyle用の汎用型
type CardStyle = StyleProp<ViewStyle>;

function formatRating(rating: number): string {
  return rating.toFixed(1);
}

export type ShopCardProps = {
  shop: Shop;
  onPress: (shopId: string) => void;
  variant?: ShopCardVariant;
  style?: CardStyle;
  formatMeta?: (shop: Shop) => string;
  /** ブースト表示（炎アイコン・ボーダー強調） */
  isBoosted?: boolean;
  /** おすすめカテゴリ（例：「味」「接客」など）- large variantで表示 */
  featuredCategory?: string;
};

export type { ShopCardVariant };

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
  isBoosted = false,
  featuredCategory,
}: ShopCardProps) {
  const handlePress = () => {
    onPress(shop.id);
  };

  const metaText =
    formatMeta?.(shop) ??
    `${shop.category} • 徒歩${shop.distanceMinutes}分 • 予算 ${BUDGET_LABEL[shop.budget]}`;

  if (variant === 'large') {
    return (
      <View style={[styles.largeShadow, isBoosted && styles.largeShadowBoosted, style]}>
        <Pressable
          onPress={handlePress}
          style={[styles.largeContainer, isBoosted && styles.largeContainerBoosted]}
        >
          {isBoosted && (
            <View style={styles.boostBadge}>
              <Ionicons name='flame' size={16} color={palette.boostRed} />
            </View>
          )}
          <Image contentFit='cover' source={{ uri: shop.imageUrl }} style={styles.largeImage} />

          <View style={styles.largeBody}>
            <View style={styles.header}>
              <Text style={styles.largeTitle} numberOfLines={1}>
                {shop.name}
              </Text>
              {featuredCategory && (
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{featuredCategory}</Text>
                  <Ionicons name='thumbs-up' size={12} color={palette.metaBadgeText} />
                </View>
              )}
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
    <View style={[styles.compactShadow, style]}>
      <Pressable
        onPress={handlePress}
        style={[styles.compactContainer, isBoosted && styles.compactContainerBoosted]}
      >
        {isBoosted && (
          <View style={[styles.boostBadge, styles.boostBadgeCompact]}>
            <Ionicons name='flame' size={12} color={palette.boostRed} />
          </View>
        )}
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
    </View>
  );
}

export const ShopCard = memo(ShopCardComponent);

const styles = StyleSheet.create({
  boostBadge: {
    alignItems: 'center',
    backgroundColor: palette.boostBadgeBg,
    borderRadius: 999,
    justifyContent: 'center',
    padding: 8,
    position: 'absolute',
    right: 12,
    top: 12,
    zIndex: 1,
  },
  boostBadgeCompact: {
    padding: 4,
    right: 8,
    top: 8,
  },
  categoryBadge: {
    alignItems: 'center',
    backgroundColor: palette.metaBadgeBg,
    borderColor: palette.metaBadgeBorder,
    borderRadius: BORDER_RADIUS.PILL,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: SPACING.SM,
    paddingVertical: 4,
  },
  categoryBadgeText: {
    color: palette.metaBadgeText,
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  compactContainer: {
    backgroundColor: palette.surface,
    borderColor: palette.divider,
    borderRadius: BORDER_RADIUS.LARGE,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  compactContainerBoosted: {
    borderColor: palette.boostBorder,
    borderWidth: 2,
  },
  compactDescription: {
    color: palette.secondaryText,
    fontFamily: fonts.regular,
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
    fontFamily: fonts.regular,
    fontSize: 12,
    marginBottom: SPACING.XS,
  },
  compactName: {
    color: palette.primaryText,
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
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
    fontFamily: fonts.medium,
    fontSize: 11,
  },
  compactShadow: {
    backgroundColor: palette.surface,
    borderRadius: BORDER_RADIUS.LARGE,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
    elevation: 2,
    marginBottom: SPACING.MD,
  },
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
    position: 'relative',
  },
  largeContainerBoosted: {
    borderColor: palette.boostBorder,
    borderWidth: 2,
  },
  largeDescription: {
    color: palette.tertiaryText,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    marginTop: SPACING.MD,
  },
  largeImage: {
    height: LAYOUT.SHOP_CARD_IMAGE_HEIGHT,
    width: '100%',
  },
  largeMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: SPACING.MD,
  },
  largeShadow: {
    backgroundColor: palette.surface,
    borderRadius: 28,
    boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.08)',
    elevation: 5,
    marginBottom: SPACING.XL,
  },
  largeShadowBoosted: {
    // shadowColor: palette.boostRed, // Optional: add colored shadow for boost
  },
  largeTitle: {
    color: palette.primaryText,
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 18,
    marginRight: SPACING.MD,
  },
  metaSeparator: {
    color: palette.divider,
    fontFamily: fonts.regular,
    fontSize: 13,
    marginHorizontal: 6,
  },
  metaText: {
    color: palette.secondaryText,
    fontFamily: fonts.regular,
    fontSize: 13,
  },
});