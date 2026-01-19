/**
 * Design tokens for consistent styling across web and mobile applications.
 * These values should be used instead of hardcoded numbers to ensure
 * design consistency and make global changes easier.
 */

/**
 * Border radius values in pixels.
 */
export const BORDER_RADIUS = {
  /** For pill-shaped buttons and badges */
  PILL: 999,
  /** Small rounded corners */
  SMALL: 4,
  /** Medium rounded corners */
  MEDIUM: 12,
  /** Large rounded corners */
  LARGE: 16,
  /** Extra large rounded corners */
  XLARGE: 16,
} as const;

/**
 * Spacing values in pixels for margins and padding.
 */
export const SPACING = {
  /** Extra small: 4px */
  XS: 4,
  /** Small: 8px */
  SM: 8,
  /** Medium: 12px */
  MD: 12,
  /** Large: 16px */
  LG: 16,
  /** Extra large: 20px */
  XL: 20,
  /** Extra extra large: 24px */
  XXL: 24,
  /** Extra extra extra large: 60px */
  XXXL: 60,
} as const;

/**
 * Icon size values in pixels.
 */
export const ICON_SIZE = {
  /** Extra small: 18px */
  XS: 18,
  /** Small: 16px */
  SM: 16,
  /** Medium: 20px */
  MD: 20,
  /** Medium-large: 22px */
  ML: 22,
  /** Large: 24px */
  LG: 24,
  /** Extra large: 28px */
  XL: 28,
  /** Extra extra large: 32px */
  XXL: 32,
} as const;

/**
 * Font size values in pixels.
 */
export const FONT_SIZE = {
  /** Extra small: 12px */
  XS: 12,
  /** Small: 13px */
  SM: 13,
  /** Medium: 14px */
  MD: 14,
  /** Large: 16px */
  LG: 16,
  /** Extra large: 18px */
  XL: 18,
  /** Extra extra large: 20px */
  XXL: 20,
  /** Extra extra extra large: 22px */
  XXXL: 22,
} as const;

/**
 * Timing values in milliseconds for animations and delays.
 */
export const TIMING = {
  /** Debounce delay for search input */
  DEBOUNCE_SEARCH: 180,
  /** Duration for toast notifications */
  TOAST_DURATION: 2400,
  /** Delay for load more pagination */
  LOAD_MORE_DELAY: 350,
  /** Delay for mock form submissions (dev/testing) */
  MOCK_SUBMIT_DELAY: 600,
  /** Scroll event throttle for ScrollView */
  SCROLL_THROTTLE: 16,
} as const;

/**
 * Font weight values for text styling.
 */
export const FONT_WEIGHT = {
  NORMAL: '400' as const,
  MEDIUM: '500' as const,
  SEMIBOLD: '600' as const,
  BOLD: '700' as const,
  EXTRA_BOLD: '800' as const,
} as const;

/**
 * Layout constants for mobile app.
 */
export const LAYOUT = {
  /**
   * Tab bar bottom spacing for ScrollView contentContainerStyle.
   * This ensures content doesn't get hidden behind the fixed tab bar.
   */
  TAB_BAR_SPACING: 125,
  /** Header height for mobile app */
  HEADER_HEIGHT: 50,
  /** Review image size */
  REVIEW_IMAGE_SIZE: 88,
  /** Hero image height */
  HERO_IMAGE_HEIGHT: 220,
  /** Shop card image height */
  SHOP_CARD_IMAGE_HEIGHT: 176,
  /** Medium button height */
  BUTTON_HEIGHT_MD: 44,
  /** Large button height */
  BUTTON_HEIGHT_LG: 48,
  /** Parallax scroll view header height */
  PARALLAX_HEADER_HEIGHT: 250,
} as const;

// Type exports for TypeScript consumers
export type BorderRadiusKey = keyof typeof BORDER_RADIUS;
export type SpacingKey = keyof typeof SPACING;
export type IconSizeKey = keyof typeof ICON_SIZE;
export type FontSizeKey = keyof typeof FONT_SIZE;
export type TimingKey = keyof typeof TIMING;
export type FontWeightKey = keyof typeof FONT_WEIGHT;
export type LayoutKey = keyof typeof LAYOUT;
