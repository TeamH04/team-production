/**
 * ThemedText コンポーネント
 *
 * @team/mobile-ui の createThemedText を使用し、
 * アプリ固有の useThemeColor hook を注入して作成
 */
import { createThemedText } from '@team/mobile-ui';

import { useThemeColor } from '@/hooks/useThemeColor';

export const ThemedText = createThemedText(useThemeColor);
export type { ThemedTextProps, ThemedTextType } from '@team/mobile-ui';
