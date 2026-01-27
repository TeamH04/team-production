/**
 * テーマカラー取得のオプション
 */
export type GetThemeColorOptions<TColors> = {
  /** propsで指定された色（light/dark） */
  props: { light?: string; dark?: string };
  /** 取得するカラー名 */
  colorName: keyof TColors;
  /** 現在のカラースキーム */
  colorScheme: 'light' | 'dark';
  /** アプリのカラー定義 */
  colors: { light: TColors; dark: TColors };
};

/**
 * useThemeColor hookのオプション
 */
export type UseThemeColorOptions<TColors> = {
  /** propsで指定された色（light/dark） */
  props: { light?: string; dark?: string };
  /** 取得するカラー名 */
  colorName: keyof TColors;
  /** アプリのカラー定義 */
  colors: { light: TColors; dark: TColors };
};

/**
 * テーマに応じた色を取得する純粋関数
 *
 * @param options - テーマカラー取得オプション
 * @returns テーマに応じた色文字列
 *
 * @example
 * ```ts
 * const color = getThemeColor({
 *   props: { light: '#fff', dark: '#000' },
 *   colorName: 'background',
 *   colorScheme: 'light',
 *   colors: { light: Colors.light, dark: Colors.dark },
 * });
 * ```
 */
export function getThemeColor<TColors>(options: GetThemeColorOptions<TColors>): string {
  const { props, colorName, colorScheme, colors } = options;
  const themeKey = colorScheme === 'dark' ? 'dark' : 'light';
  const colorFromProps = props[themeKey];

  if (colorFromProps) {
    return colorFromProps;
  }

  return colors[themeKey][colorName] as string;
}

/**
 * useThemeColor hookを作成するファクトリ関数
 *
 * React Native固有のuseColorSchemeを外部から注入することで、
 * フレームワーク非依存の形でhookを作成できます。
 *
 * @param useColorScheme - プラットフォーム固有のカラースキーム取得hook
 * @returns useThemeColor hook
 *
 * @example
 * ```ts
 * // apps/mobile/hooks/useThemeColor.ts
 * import { createUseThemeColor } from '@team/hooks';
 * import { useColorScheme } from 'react-native';
 * import { Colors } from '@/constants/Colors';
 *
 * export const useThemeColor = createUseThemeColor(useColorScheme, Colors);
 * ```
 */
export function createUseThemeColor<TColors>(
  useColorScheme: () => 'light' | 'dark' | 'unspecified' | null | undefined,
  colors: { light: TColors; dark: TColors },
) {
  return function useThemeColor(
    props: { light?: string; dark?: string },
    colorName: keyof TColors,
  ): string {
    const theme = useColorScheme() ?? 'light';
    const colorScheme = theme === 'dark' ? 'dark' : 'light';

    return getThemeColor({
      props,
      colorName,
      colorScheme,
      colors,
    });
  };
}
