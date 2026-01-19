/**
 * Modal style presets for consistent modal/overlay styling across the mobile app.
 * Use these presets instead of defining modal styles inline.
 */
import { BORDER_RADIUS, FONT_SIZE, FONT_WEIGHT, SPACING } from '@team/constants';
import { withAlpha } from '@team/theme';

import { palette } from './palette';

/**
 * Opacity values for modal overlays.
 */
export const MODAL_OVERLAY_OPACITY = {
  /** Light overlay (0.3) - for picker modals */
  LIGHT: 0.3,
  /** Standard overlay (0.5) - for most modals */
  STANDARD: 0.5,
} as const;

/**
 * Common modal style presets.
 */
export const modalStyles = {
  /**
   * Centered overlay - dark background with centered content alignment.
   * Used for sort modals, confirmation dialogs, etc.
   */
  overlay: {
    alignItems: 'center' as const,
    backgroundColor: withAlpha('#000000', MODAL_OVERLAY_OPACITY.STANDARD),
    flex: 1,
    justifyContent: 'center' as const,
  },

  /**
   * Light overlay - for bottom sheet style picker modals.
   * The overlay itself does not center content; use with separate content container.
   */
  overlayLight: {
    backgroundColor: palette.shadow,
    flex: 1,
    opacity: MODAL_OVERLAY_OPACITY.LIGHT,
  },

  /**
   * Standard modal container - white background with rounded corners.
   * Used for centered modal content.
   */
  container: {
    backgroundColor: palette.surface,
    borderRadius: BORDER_RADIUS.MEDIUM,
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)' as const,
    maxHeight: 200,
    minWidth: 250,
    overflow: 'hidden' as const,
    width: 280,
  },

  /**
   * Bottom sheet style container - for picker modals that slide from bottom.
   */
  bottomSheetContainer: {
    backgroundColor: palette.surface,
    borderTopLeftRadius: BORDER_RADIUS.MEDIUM,
    borderTopRightRadius: BORDER_RADIUS.MEDIUM,
  },

  /**
   * Modal toolbar - for picker modals with done/cancel buttons.
   */
  toolbar: {
    alignItems: 'flex-end' as const,
    borderBottomWidth: 1,
    borderColor: palette.border,
    padding: SPACING.MD,
  },

  /**
   * Done button text style in toolbar.
   */
  toolbarDoneText: {
    color: palette.accent,
    fontWeight: FONT_WEIGHT.BOLD,
  },
} as const;

/**
 * Sort modal specific styles.
 */
export const sortModalStyles = {
  /**
   * Option row container.
   */
  option: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: SPACING.XL,
    paddingVertical: FONT_SIZE.MD,
  },

  /**
   * Active/selected option background.
   */
  optionActive: {
    backgroundColor: palette.highlight,
  },

  /**
   * Separator between options.
   */
  separator: {
    backgroundColor: palette.border,
    height: 1,
  },

  /**
   * Option text style.
   */
  optionText: {
    color: palette.primaryText,
    fontSize: FONT_SIZE.MD,
    fontWeight: FONT_WEIGHT.NORMAL,
  },

  /**
   * Active/selected option text style.
   */
  optionTextActive: {
    fontWeight: FONT_WEIGHT.BOLD,
  },
} as const;
