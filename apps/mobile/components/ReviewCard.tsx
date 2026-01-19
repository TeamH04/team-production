import { Ionicons } from '@expo/vector-icons';
import { BORDER_RADIUS, FONT_WEIGHT, SPACING } from '@team/constants';
import { formatDateJa } from '@team/core-utils';
import { getReviewFileUrl } from '@team/hooks';
import { palette, type ReviewCardProps } from '@team/mobile-ui';
import { Image } from 'expo-image';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

/**
 * レビューカードの共通コンポーネント
 *
 * MyPageScreen, ReviewHistoryScreen で使用されるレビューカードを統一
 */
function ReviewCardComponent({
  review,
  shopName,
  shopImage,
  onPress,
  onLikePress,
  isLiked,
  likeCount,
  showShopInfo = true,
  style,
}: ReviewCardProps) {
  const liked = isLiked ?? review.likedByMe;
  const likes = likeCount ?? review.likesCount;

  const formattedDate = formatDateJa(review.createdAt);

  const content = (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        {/* 店舗画像 */}
        {showShopInfo && shopImage && (
          <Image source={{ uri: shopImage }} style={styles.shopImage} contentFit='cover' />
        )}

        <View style={styles.textContainer}>
          {/* 店舗名 */}
          {showShopInfo && shopName && (
            <Text style={styles.shopName} numberOfLines={1}>
              {shopName}
            </Text>
          )}

          {/* 評価と日付 */}
          <View style={styles.metaRow}>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>★ {review.rating}</Text>
            </View>
            <Text style={styles.dateText}>{formattedDate}</Text>
          </View>

          {/* メニュー名 */}
          {review.menuItemName && (
            <Text style={styles.menuText} numberOfLines={1}>
              メニュー: {review.menuItemName}
            </Text>
          )}

          {/* コメント */}
          {review.comment && (
            <Text style={styles.commentText} numberOfLines={3}>
              {review.comment}
            </Text>
          )}

          {/* いいねボタン */}
          <View style={styles.footer}>
            <Pressable
              style={styles.likeButton}
              onPress={onLikePress}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={liked ? 'heart' : 'heart-outline'}
                size={18}
                color={liked ? palette.favoriteActive : palette.secondaryText}
              />
              <Text style={[styles.likeText, liked && styles.likeTextActive]}>{likes}</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* レビュー画像 */}
      {review.files.length > 0 && (
        <View style={styles.imagesContainer}>
          {review.files.map(file => {
            const url = getReviewFileUrl(file);
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
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={[styles.shadow, style]}>
        {content}
      </Pressable>
    );
  }

  return <View style={[styles.shadow, style]}>{content}</View>;
}

export const ReviewCard = memo(ReviewCardComponent);

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.surface,
    borderColor: palette.divider,
    borderRadius: BORDER_RADIUS.LARGE,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    padding: SPACING.MD,
  },
  commentText: {
    color: palette.secondaryText,
    fontSize: 13,
    lineHeight: 18,
    marginTop: SPACING.SM,
  },
  dateText: {
    color: palette.secondaryText,
    fontSize: 12,
    marginLeft: SPACING.SM,
  },
  footer: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    marginTop: SPACING.MD,
  },
  imagesContainer: {
    borderTopColor: palette.divider,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: SPACING.XS,
    padding: SPACING.SM,
  },
  likeButton: {
    alignItems: 'center',
    backgroundColor: palette.grayLight,
    borderRadius: BORDER_RADIUS.PILL,
    flexDirection: 'row',
    gap: SPACING.XS,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  likeText: {
    color: palette.secondaryText,
    fontSize: 12,
    fontWeight: '500',
  },
  likeTextActive: {
    color: palette.favoriteActive,
  },
  menuText: {
    color: palette.tertiaryText,
    fontSize: 12,
    marginTop: SPACING.XS,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: SPACING.XS,
  },
  ratingBadge: {
    backgroundColor: palette.highlight,
    borderRadius: BORDER_RADIUS.PILL,
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
  },
  ratingText: {
    color: palette.ratingText,
    fontSize: 12,
    fontWeight: FONT_WEIGHT.SEMIBOLD,
  },
  reviewImage: {
    borderRadius: BORDER_RADIUS.MEDIUM,
    height: 60,
    width: 60,
  },
  shadow: {
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
    elevation: 2,
    marginBottom: SPACING.MD,
  },
  shopImage: {
    borderRadius: BORDER_RADIUS.MEDIUM,
    height: 80,
    marginRight: SPACING.MD,
    width: 80,
  },
  shopName: {
    color: palette.primaryText,
    fontSize: 15,
    fontWeight: FONT_WEIGHT.SEMIBOLD,
  },
  textContainer: {
    flex: 1,
  },
});
