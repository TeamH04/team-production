import { fontFamilies } from '@team/theme';

export const fonts = {
  regular: fontFamilies.sans,
  medium: fontFamilies.medium,
} as const;

export const typography = {
  h1: {
    fontFamily: fonts.medium,
    fontSize: 28,
    lineHeight: 36,
  },
  h2: {
    fontFamily: fonts.medium,
    fontSize: 24,
    lineHeight: 32,
  },
  h3: {
    fontFamily: fonts.medium,
    fontSize: 20,
    lineHeight: 28,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  bodySmall: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  button: {
    fontFamily: fonts.medium,
    fontSize: 16,
    lineHeight: 24,
  },
} as const;
