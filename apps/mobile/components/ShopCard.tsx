import { BORDER_RADIUS, FONT_WEIGHT, formatRating, LAYOUT, SPACING } from '@team/constants';
import { palette, type ShopCardProps, type ShopCardVariant } from '@team/mobile-ui';
import { BUDGET_LABEL } from '@team/shop-core';
import { Image } from 'expo-image';
import { memo } from 'react';
import { Image as RNImage, Pressable, StyleSheet, Text, View } from 'react-native';

export type { ShopCardProps, ShopCardVariant };

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
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
    elevation: 2,
    flexDirection: 'row',
    marginBottom: SPACING.MD,
    overflow: 'hidden',
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
    fontWeight: FONT_WEIGHT.SEMIBOLD,
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
    fontWeight: FONT_WEIGHT.SEMIBOLD,
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
    height: LAYOUT.SHOP_CARD_IMAGE_HEIGHT,
    width: '100%',
  },
  largeMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: SPACING.MD,
  },
  largeShadow: {
    boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.08)',
    elevation: 5,
    marginBottom: SPACING.XL,
  },
  largeTitle: {
    color: palette.primaryText,
    flex: 1,
    fontSize: 18,
    fontWeight: FONT_WEIGHT.BOLD,
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
    fontWeight: FONT_WEIGHT.SEMIBOLD,
  },
});
