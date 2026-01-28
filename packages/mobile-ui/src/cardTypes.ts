import { type StyleProp, type ViewStyle } from 'react-native';

import type {
  MobileReviewCardPropsBase,
  MobileShopCardPropsBase,
  ShopCardVariant,
} from '@team/types';

// Re-export ShopCardVariant for convenience
export type { ShopCardVariant };

/**
 * カードコンポーネントのスタイル型
 * React Native の StyleProp<ViewStyle> と互換性を持つ汎用型
 */
export type CardStyle = StyleProp<ViewStyle>;

/**
 * ShopCard コンポーネントの props
 * @team/types の MobileShopCardPropsBase を拡張し、スタイルプロパティを追加
 */
export interface ShopCardProps extends MobileShopCardPropsBase {
  style?: CardStyle;
}

/**
 * ReviewCard コンポーネントの props
 * @team/types の MobileReviewCardPropsBase を拡張し、スタイルプロパティを追加
 */
export interface ReviewCardProps extends MobileReviewCardPropsBase {
  style?: CardStyle;
}
