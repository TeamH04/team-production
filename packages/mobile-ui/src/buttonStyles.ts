/**
 * Button style presets for consistent styling across mobile applications.
 * These presets can be used with Pressable or TouchableOpacity components.
 */

import { BORDER_RADIUS, FONT_SIZE, FONT_WEIGHT, LAYOUT, SPACING } from '@team/constants';
import { shadows } from '@team/theme';

import { palette } from './palette';

import type { TextStyle, ViewStyle } from 'react-native';

/**
 * Button container styles - apply to the outer View/Pressable wrapper
 */
export const buttonContainerStyles = {
  /** Primary button with shadow - pill shaped */
  primary: {
    ...shadows.button,
    backgroundColor: palette.button,
    borderColor: palette.buttonBorder,
    borderRadius: BORDER_RADIUS.PILL,
    borderWidth: 1,
    height: LAYOUT.BUTTON_HEIGHT_MD,
    minWidth: LAYOUT.BUTTON_MIN_WIDTH,
    overflow: 'hidden',
  } as ViewStyle,

  /** Large primary button */
  primaryLarge: {
    ...shadows.button,
    backgroundColor: palette.button,
    borderColor: palette.buttonBorder,
    borderRadius: BORDER_RADIUS.PILL,
    borderWidth: 1,
    height: LAYOUT.BUTTON_HEIGHT_LG,
    minWidth: LAYOUT.BUTTON_MIN_WIDTH,
    overflow: 'hidden',
  } as ViewStyle,

  /** Secondary button with border */
  secondary: {
    backgroundColor: palette.secondarySurface,
    borderColor: palette.border,
    borderRadius: BORDER_RADIUS.MEDIUM,
    borderWidth: 1,
  } as ViewStyle,

  /** Outline button - transparent background with border */
  outline: {
    backgroundColor: palette.transparent,
    borderColor: palette.border,
    borderRadius: BORDER_RADIUS.MEDIUM,
    borderWidth: 1,
  } as ViewStyle,

  /** Accent button - uses accent color */
  accent: {
    backgroundColor: palette.accent,
    borderRadius: BORDER_RADIUS.MEDIUM,
  } as ViewStyle,

  /** Dev/utility button style */
  utility: {
    backgroundColor: palette.outline,
    borderRadius: BORDER_RADIUS.MEDIUM,
  } as ViewStyle,
} as const;

/**
 * Button pressable inner styles - apply to the inner Pressable content area
 */
export const buttonPressableStyles = {
  /** Standard pressable inner style */
  base: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.XXL,
  } as ViewStyle,

  /** Pressable inner style with vertical padding */
  padded: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: FONT_SIZE.MD,
    paddingVertical: SPACING.MD,
  } as ViewStyle,
} as const;

/**
 * Button text styles - apply to the Text component inside the button
 */
export const buttonTextStyles = {
  /** Primary button text - white on primary color */
  primary: {
    color: palette.surface,
    fontSize: FONT_SIZE.LG,
    fontWeight: FONT_WEIGHT.BOLD,
    textAlign: 'center',
  } as TextStyle,

  /** Primary button text with fixed line height for MD height buttons */
  primaryMd: {
    color: palette.surface,
    fontSize: FONT_SIZE.LG,
    fontWeight: FONT_WEIGHT.BOLD,
    height: LAYOUT.BUTTON_HEIGHT_MD,
    lineHeight: LAYOUT.BUTTON_HEIGHT_MD,
    textAlign: 'center',
  } as TextStyle,

  /** Primary button text with fixed line height for LG height buttons */
  primaryLg: {
    color: palette.surface,
    fontSize: FONT_SIZE.LG,
    fontWeight: FONT_WEIGHT.BOLD,
    height: LAYOUT.BUTTON_HEIGHT_LG,
    lineHeight: LAYOUT.BUTTON_HEIGHT_LG,
    textAlign: 'center',
  } as TextStyle,

  /** Secondary button text - uses link/primary color */
  secondary: {
    color: palette.link,
    fontWeight: FONT_WEIGHT.BOLD,
    textAlign: 'center',
  } as TextStyle,

  /** Outline button text - dark gray */
  outline: {
    color: palette.grayDark,
    fontSize: FONT_SIZE.XXL,
    fontWeight: FONT_WEIGHT.BOLD,
    textAlign: 'center',
  } as TextStyle,

  /** Accent button text - white on accent */
  accent: {
    color: palette.primaryOnAccent,
    fontWeight: FONT_WEIGHT.BOLD,
    textAlign: 'center',
  } as TextStyle,

  /** Utility/dev button text */
  utility: {
    color: palette.black,
    fontWeight: FONT_WEIGHT.BOLD,
    textAlign: 'center',
  } as TextStyle,
} as const;

/**
 * Button state styles - apply conditionally based on button state
 */
export const buttonStateStyles = {
  /** Pressed state - reduced opacity */
  pressed: {
    opacity: 0.7,
  } as ViewStyle,

  /** Loading state - slightly reduced opacity */
  loading: {
    opacity: 0.75,
  } as ViewStyle,

  /** Disabled state - significantly reduced opacity */
  disabled: {
    opacity: 0.5,
  } as ViewStyle,
} as const;

/**
 * Complete button style presets combining container, pressable, and text styles
 */
export const buttonStyles = {
  /** Primary button - pill shaped with shadow */
  primary: {
    container: buttonContainerStyles.primary,
    pressable: buttonPressableStyles.base,
    text: buttonTextStyles.primaryMd,
  },

  /** Large primary button */
  primaryLarge: {
    container: buttonContainerStyles.primaryLarge,
    pressable: buttonPressableStyles.base,
    text: buttonTextStyles.primaryLg,
  },

  /** Secondary button - bordered with transparent/light background */
  secondary: {
    container: buttonContainerStyles.secondary,
    pressable: buttonPressableStyles.padded,
    text: buttonTextStyles.secondary,
  },

  /** Outline button - transparent with border */
  outline: {
    container: buttonContainerStyles.outline,
    pressable: buttonPressableStyles.padded,
    text: buttonTextStyles.outline,
  },

  /** Accent button - uses accent color */
  accent: {
    container: buttonContainerStyles.accent,
    pressable: buttonPressableStyles.padded,
    text: buttonTextStyles.accent,
  },

  /** Utility/dev button */
  utility: {
    container: buttonContainerStyles.utility,
    pressable: buttonPressableStyles.padded,
    text: buttonTextStyles.utility,
  },
} as const;

// Type exports
export type ButtonVariant = keyof typeof buttonStyles;
export type ButtonContainerVariant = keyof typeof buttonContainerStyles;
export type ButtonTextVariant = keyof typeof buttonTextStyles;
export type ButtonStateVariant = keyof typeof buttonStateStyles;
