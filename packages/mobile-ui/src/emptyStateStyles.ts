import { BORDER_RADIUS, FONT_SIZE, FONT_WEIGHT, SPACING } from '@team/constants';
import { colors, withAlpha } from '@team/theme';

/**
 * Empty state style presets for mobile UI components.
 * These styles provide consistent empty state presentations across the app.
 */

/**
 * Base container styles for empty states.
 * Use these for the outer View that wraps empty state content.
 */
export const emptyStateContainerStyles = {
  /** Centered empty state that fills available space (flex: 1) */
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  /** Empty state with vertical padding, no flex */
  padded: {
    alignItems: 'center',
    paddingVertical: SPACING.XXXL,
  },
  /** Card-style empty state with background and border radius */
  card: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: BORDER_RADIUS.LARGE,
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.XXL,
  },
} as const;

/**
 * Text styles for empty state titles/headings.
 */
export const emptyStateTitleStyles = {
  /** Default title style - muted color, medium font */
  default: {
    color: withAlpha(colors.primary, 0.7),
    fontSize: FONT_SIZE.MD,
  },
  /** Large title with semi-bold weight and bottom margin */
  prominent: {
    color: withAlpha(colors.primary, 0.7),
    fontSize: FONT_SIZE.LG,
    fontWeight: FONT_WEIGHT.SEMIBOLD,
    marginBottom: SPACING.XL,
  },
} as const;

/**
 * Text styles for empty state descriptions/subtitles.
 */
export const emptyStateDescriptionStyles = {
  /** Default description style - muted color, centered text */
  default: {
    color: withAlpha(colors.primary, 0.5),
    fontSize: FONT_SIZE.LG,
    textAlign: 'center',
  },
  /** Secondary description style - lighter color */
  secondary: {
    color: withAlpha(colors.primary, 0.5),
    fontSize: FONT_SIZE.MD,
    textAlign: 'center',
  },
} as const;

/**
 * Image styles for empty state illustrations.
 */
export const emptyStateImageStyles = {
  /** Standard empty state image size */
  default: {
    height: 200,
    width: 280,
  },
  /** Small empty state image */
  small: {
    height: 120,
    width: 168,
  },
  /** Large empty state image */
  large: {
    height: 280,
    width: 392,
  },
} as const;

/**
 * Combined preset configurations for common empty state patterns.
 * These provide ready-to-use style combinations.
 */
export const emptyStatePresets = {
  /** Full-screen centered empty state (e.g., empty favorites list) */
  fullScreen: {
    container: emptyStateContainerStyles.centered,
    title: emptyStateTitleStyles.default,
    description: emptyStateDescriptionStyles.default,
  },
  /** Padded empty state for search results */
  searchResults: {
    container: emptyStateContainerStyles.padded,
    title: emptyStateTitleStyles.prominent,
    description: emptyStateDescriptionStyles.default,
    image: emptyStateImageStyles.default,
  },
  /** Card-style empty state with background (e.g., review history) */
  card: {
    container: emptyStateContainerStyles.card,
    title: emptyStateTitleStyles.default,
    description: emptyStateDescriptionStyles.secondary,
  },
  /** Simple padded empty state for history lists */
  history: {
    container: emptyStateContainerStyles.padded,
    title: emptyStateTitleStyles.default,
    description: emptyStateDescriptionStyles.default,
  },
} as const;

// Type exports for TypeScript consumers
export type EmptyStateContainerStyle = keyof typeof emptyStateContainerStyles;
export type EmptyStateTitleStyle = keyof typeof emptyStateTitleStyles;
export type EmptyStateDescriptionStyle = keyof typeof emptyStateDescriptionStyles;
export type EmptyStateImageStyle = keyof typeof emptyStateImageStyles;
export type EmptyStatePreset = keyof typeof emptyStatePresets;
