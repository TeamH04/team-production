/**
 * Input style presets for consistent styling across mobile applications.
 * These presets can be used with TextInput components.
 */

import { BORDER_RADIUS, SPACING } from '@team/constants';

import { palette } from './palette';

import type { TextStyle, ViewStyle } from 'react-native';

/**
 * Base input style - shared properties for all input variants
 */
const baseInputStyle = {
  backgroundColor: palette.background,
  borderColor: palette.border,
  borderRadius: BORDER_RADIUS.MEDIUM,
  borderWidth: 1,
  color: palette.primary,
  paddingHorizontal: 14,
  paddingVertical: SPACING.MD,
} as const;

/**
 * Input container styles - apply to the TextInput component
 */
export const inputStyles = {
  /** Default input style */
  default: baseInputStyle as TextStyle,

  /** Input with margin top for form groups */
  withMarginTop: {
    ...baseInputStyle,
    marginTop: SPACING.SM,
  } as TextStyle,

  /** Multiline textarea style */
  multiline: {
    ...baseInputStyle,
    minHeight: 100,
    textAlignVertical: 'top',
  } as TextStyle,

  /** Input with error state */
  error: {
    ...baseInputStyle,
    borderColor: palette.errorText,
  } as TextStyle,
} as const;

/**
 * Input label styles
 */
export const inputLabelStyles = {
  /** Default label style */
  default: {
    color: palette.primaryText,
    fontWeight: '700' as const,
    marginBottom: SPACING.SM,
  } as TextStyle,

  /** Label with required indicator styling */
  required: {
    color: palette.primaryText,
    fontWeight: '700' as const,
    marginBottom: SPACING.SM,
  } as TextStyle,
} as const;

/**
 * Form group container styles
 */
export const formGroupStyles = {
  /** Default form group container */
  default: {
    marginBottom: SPACING.LG,
  } as ViewStyle,

  /** Inline form group (label + input in row) */
  inline: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: SPACING.LG,
  } as ViewStyle,
} as const;

// Type exports
export type InputVariant = keyof typeof inputStyles;
export type InputLabelVariant = keyof typeof inputLabelStyles;
export type FormGroupVariant = keyof typeof formGroupStyles;
