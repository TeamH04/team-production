/**
 * Shared style constants for consistent styling across web and mobile applications.
 */

/**
 * Shadow style presets for React Native.
 */
export const SHADOW_STYLES = {
  /** Default shadow for buttons and interactive elements */
  DEFAULT: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 4,
  },
  /** Card shadow with subtle depth */
  CARD: {
    boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.06)',
    elevation: 4,
  },
  /** Light shadow for smaller elements */
  LIGHT: {
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
    elevation: 2,
  },
  /** Section shadow for grouped content */
  SECTION: {
    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.05)',
    elevation: 3,
  },
} as const;
