import { fontFamilies, typographyScale } from '@team/theme';

export const fonts = {
  regular: fontFamilies.sans,
  medium: fontFamilies.medium,
} as const;

// @team/theme のタイポグラフィスケールをReact Native用に変換
const createTypography = () => {
  const result = {} as Record<
    keyof typeof typographyScale,
    { fontFamily: string; fontSize: number; lineHeight: number }
  >;

  for (const [key, value] of Object.entries(typographyScale)) {
    result[key as keyof typeof typographyScale] = {
      fontFamily: value.fontWeight === 'medium' ? fonts.medium : fonts.regular,
      fontSize: value.fontSize,
      lineHeight: value.lineHeight,
    };
  }

  return result;
};

export const typography = createTypography();
