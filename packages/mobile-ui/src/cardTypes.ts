import { type StyleProp, type ViewStyle } from 'react-native';

import type { Review, Shop } from '@team/types';

/**
 * ShopCard のバリアント型
 */
export type ShopCardVariant = 'large' | 'compact';

/**
 * カードコンポーネントのスタイル型
 * React Native の StyleProp<ViewStyle> と互換性を持つ汎用型
 */
export type CardStyle = StyleProp<ViewStyle>;

/**
 * ShopCard コンポーネントの props
 */
export interface ShopCardProps {
  shop: Shop;
  onPress: (shopId: string) => void;
  variant?: ShopCardVariant;
  style?: CardStyle;
  formatMeta?: (shop: Shop) => string;
  /** ブースト表示（炎アイコン・ボーダー強調） */
  isBoosted?: boolean;
  /** おすすめカテゴリ（例：「味」「接客」など）- large variantで表示 */
  featuredCategory?: string;
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
