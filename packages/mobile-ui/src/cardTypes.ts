import type { Shop, Review } from '@team/types';

/**
 * ShopCard のバリアント型
 */
export type ShopCardVariant = 'large' | 'compact';

/**
 * カードコンポーネントのスタイル型
 * React Native の StyleProp<ViewStyle> と互換性を持つ汎用型
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CardStyle = any;

/**
 * ShopCard コンポーネントの props
 */
export interface ShopCardProps {
  shop: Shop;
  onPress: (shopId: string) => void;
  variant?: ShopCardVariant;
  style?: CardStyle;
  formatMeta?: (shop: Shop) => string;
}

/**
 * ReviewCard コンポーネントの props
 */
export interface ReviewCardProps {
  review: Review;
  shopName?: string;
  shopImage?: string;
  onPress?: () => void;
  onLikePress?: () => void;
  isLiked?: boolean;
  likeCount?: number;
  showShopInfo?: boolean;
  style?: CardStyle;
}
