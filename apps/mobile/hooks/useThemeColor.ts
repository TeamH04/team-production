/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { createUseThemeColor } from '@team/hooks';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

/**
 * テーマに応じた色を取得するhook
 *
 * @team/hooks の createUseThemeColor を使用し、
 * React Native 固有の useColorScheme と組み合わせて実装
 */
export const useThemeColor = createUseThemeColor(useColorScheme, Colors);
