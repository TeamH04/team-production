export const fontFamilies = {
  sans: 'KiwiMaruRegular',
  medium: 'KiwiMaruMedium',
} as const;

// Web用フォント名（next/font/google用）
export const webFontName = 'Kiwi_Maru' as const;

// 共通タイポグラフィスケール
export const typographyScale = {
  h1: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: 'medium' as const,
  },
  h2: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: 'medium' as const,
  },
  h3: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: 'medium' as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: 'regular' as const,
  },
  bodySmall: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 'regular' as const,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: 'regular' as const,
  },
  button: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: 'medium' as const,
  },
} as const;

export type TypographyVariant = keyof typeof typographyScale;
