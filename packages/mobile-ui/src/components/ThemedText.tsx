import { FONT_SIZE, FONT_WEIGHT, ICON_SIZE } from '@team/constants';
import { StyleSheet, Text, type TextProps } from 'react-native';

export type ThemedTextType = 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: ThemedTextType;
};

/**
 * useThemeColor hookの型定義
 */
export type UseThemeColorHook = (
  props: { light?: string; dark?: string },
  colorName: 'text',
) => string;

/**
 * ThemedTextコンポーネントを作成するファクトリ関数
 *
 * プラットフォーム固有のuseThemeColor hookを外部から注入することで、
 * フレームワーク非依存の形でコンポーネントを作成できます。
 *
 * @param useThemeColor - テーマカラー取得hook
 * @returns ThemedText コンポーネント
 *
 * @example
 * ```tsx
 * // apps/mobile/components/ThemedText.tsx
 * import { createThemedText } from '@team/mobile-ui';
 * import { useThemeColor } from '@/hooks/useThemeColor';
 *
 * export const ThemedText = createThemedText(useThemeColor);
 * export type { ThemedTextProps } from '@team/mobile-ui';
 * ```
 */
export function createThemedText(useThemeColor: UseThemeColorHook) {
  return function ThemedText({
    style,
    lightColor,
    darkColor,
    type = 'default',
    ...rest
  }: ThemedTextProps) {
    const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

    return (
      <Text
        style={[
          { color },
          type === 'default' ? styles.default : undefined,
          type === 'title' ? styles.title : undefined,
          type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
          type === 'subtitle' ? styles.subtitle : undefined,
          type === 'link' ? styles.link : undefined,
          style,
        ]}
        {...rest}
      />
    );
  };
}

const styles = StyleSheet.create({
  default: {
    fontSize: FONT_SIZE.LG,
    lineHeight: ICON_SIZE.LG,
  },
  defaultSemiBold: {
    fontSize: FONT_SIZE.LG,
    fontWeight: FONT_WEIGHT.SEMIBOLD,
    lineHeight: ICON_SIZE.LG,
  },
  link: {
    fontSize: FONT_SIZE.LG,
    lineHeight: 30,
  },
  subtitle: {
    fontSize: FONT_SIZE.XXL,
    fontWeight: 'bold',
  },
  title: {
    fontSize: ICON_SIZE.XL,
    fontWeight: 'bold',
    lineHeight: ICON_SIZE.XL,
  },
});
