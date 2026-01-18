/**
 * Shadow style presets for React Native and Web
 *
 * Usage:
 * - React Native: Use `shadows` object for platform-specific shadow styles
 * - Web: Use `boxShadows` object for CSS box-shadow values
 */

// Shadow color constants
const SHADOW_COLOR = '#000';
const SHADOW_OPACITY_LIGHT = 0.05;
const SHADOW_OPACITY_MEDIUM = 0.08;
const SHADOW_OPACITY_DEFAULT = 0.1;
const SHADOW_OPACITY_STRONG = 0.15;

/**
 * React Native shadow styles
 *
 * Includes iOS shadow properties (shadowColor, shadowOffset, shadowOpacity, shadowRadius)
 * and Android elevation
 */
export const shadows = {
  /** No shadow */
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },

  /** Extra small shadow - subtle depth for small elements */
  xs: {
    shadowColor: SHADOW_COLOR,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: SHADOW_OPACITY_LIGHT,
    shadowRadius: 2,
    elevation: 1,
  },

  /** Small shadow - light depth for cards */
  sm: {
    shadowColor: SHADOW_COLOR,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: SHADOW_OPACITY_LIGHT,
    shadowRadius: 4,
    elevation: 2,
  },

  /** Medium shadow - balanced depth for interactive elements */
  md: {
    shadowColor: SHADOW_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: SHADOW_OPACITY_MEDIUM,
    shadowRadius: 8,
    elevation: 3,
  },

  /** Large shadow - prominent depth for elevated cards */
  lg: {
    shadowColor: SHADOW_COLOR,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: SHADOW_OPACITY_MEDIUM,
    shadowRadius: 16,
    elevation: 5,
  },

  /** Extra large shadow - high elevation for modals and overlays */
  xl: {
    shadowColor: SHADOW_COLOR,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: SHADOW_OPACITY_DEFAULT,
    shadowRadius: 24,
    elevation: 8,
  },

  /** 2XL shadow - maximum elevation for floating elements */
  '2xl': {
    shadowColor: SHADOW_COLOR,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: SHADOW_OPACITY_STRONG,
    shadowRadius: 32,
    elevation: 12,
  },

  // Semantic shadow presets

  /** Card shadow - default for card components (compact variant) */
  card: {
    shadowColor: SHADOW_COLOR,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: SHADOW_OPACITY_LIGHT,
    shadowRadius: 4,
    elevation: 2,
  },

  /** Card large shadow - for featured/large card components */
  cardLarge: {
    shadowColor: SHADOW_COLOR,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: SHADOW_OPACITY_MEDIUM,
    shadowRadius: 16,
    elevation: 5,
  },

  /** Input shadow - for search inputs and form fields */
  input: {
    shadowColor: SHADOW_COLOR,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: SHADOW_OPACITY_LIGHT,
    shadowRadius: 10,
    elevation: 3,
  },

  /** Button shadow - for elevated buttons */
  button: {
    shadowColor: SHADOW_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: SHADOW_OPACITY_DEFAULT,
    shadowRadius: 8,
    elevation: 4,
  },

  /** Modal shadow - for modal dialogs and overlays */
  modal: {
    shadowColor: SHADOW_COLOR,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: SHADOW_OPACITY_STRONG,
    shadowRadius: 32,
    elevation: 16,
  },

  /** Dropdown shadow - for dropdown menus and popovers */
  dropdown: {
    shadowColor: SHADOW_COLOR,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: SHADOW_OPACITY_DEFAULT,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

/**
 * Web box-shadow values
 *
 * CSS box-shadow format: offset-x offset-y blur-radius color
 */
export const boxShadows = {
  /** No shadow */
  none: 'none',

  /** Extra small shadow - subtle depth for small elements */
  xs: '0px 1px 2px rgba(0, 0, 0, 0.05)',

  /** Small shadow - light depth for cards */
  sm: '0px 2px 4px rgba(0, 0, 0, 0.05)',

  /** Medium shadow - balanced depth for interactive elements */
  md: '0px 4px 8px rgba(0, 0, 0, 0.08)',

  /** Large shadow - prominent depth for elevated cards */
  lg: '0px 8px 16px rgba(0, 0, 0, 0.08)',

  /** Extra large shadow - high elevation for modals and overlays */
  xl: '0px 12px 24px rgba(0, 0, 0, 0.1)',

  /** 2XL shadow - maximum elevation for floating elements */
  '2xl': '0px 16px 32px rgba(0, 0, 0, 0.15)',

  // Semantic shadow presets

  /** Card shadow - default for card components (compact variant) */
  card: '0px 2px 4px rgba(0, 0, 0, 0.05)',

  /** Card large shadow - for featured/large card components */
  cardLarge: '0px 8px 16px rgba(0, 0, 0, 0.08)',

  /** Input shadow - for search inputs and form fields */
  input: '0px 6px 10px rgba(0, 0, 0, 0.05)',

  /** Button shadow - for elevated buttons */
  button: '0px 4px 8px rgba(0, 0, 0, 0.1)',

  /** Modal shadow - for modal dialogs and overlays */
  modal: '0px 16px 32px rgba(0, 0, 0, 0.15)',

  /** Dropdown shadow - for dropdown menus and popovers */
  dropdown: '0px 8px 16px rgba(0, 0, 0, 0.1)',
} as const;

// Type definitions
export type ShadowKey = keyof typeof shadows;
export type BoxShadowKey = keyof typeof boxShadows;
