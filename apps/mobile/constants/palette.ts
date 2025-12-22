import { colors, textOn, withAlpha } from '@team/theme';

const { primary, secondary, background } = colors;
const textOnBackground = textOn.background;

export const palette = {
  // Base surfaces & text
  background,
  surface: '#FFFFFF', // Fix: Changed from secondary (green) to White for better readability
  primaryText: textOnBackground,
  secondaryText: withAlpha(textOnBackground, 0.7),
  tertiaryText: withAlpha(textOnBackground, 0.5),
  chipTextInactive: withAlpha(textOnBackground, 0.5),
  mutedText: withAlpha(textOnBackground, 0.5),

  // Borders & dividers
  border: withAlpha(primary, 0.15),
  divider: withAlpha(primary, 0.1),
  outline: withAlpha(primary, 0.2),

  // Accents & actions
  accent: secondary, // Using Secondary (Green) as UI accent
  action: primary,
  link: primary,
  button: primary,
  buttonBorder: primary,

  // Danger & alerts
  dangerBg: '#FEE2E2',
  dangerBorder: '#FECACA',
  dangerText: '#EF4444',
  error: '#EF4444',

  // Status / semantic
  highlight: withAlpha(secondary, 0.15),
  ratingText: '#F59E0B', // Standard Gold for stars

  // Brand / providers
  google: '#DB4437',
  apple: '#000000',

  // Shadows
  shadow: '#000000',
  shadowColor: '#000000',

  // Surfaces
  tagSurface: withAlpha(secondary, 0.1),
  tagText: secondary,

  // Avatars
  avatarBackground: withAlpha(primary, 0.1),
  avatarText: primary,

  // Action buttons
  primary: primary,
  primaryOnAccent: textOn.primary,
  secondarySurface: withAlpha(secondary, 0.1), // Light green tint for secondary buttons
  textOnPrimary: textOn.primary,
  textOnSecondary: secondary, // Text on secondary buttons should be green
  textOnAccent: textOn.primary,

  // Stars / ratings
  starInactive: withAlpha(textOnBackground, 0.2),
  starHighlight: '#F59E0B',

  // Favorites
  favoriteActive: '#EF4444',

  // Misc UI
  arrowButtonBg: withAlpha(textOnBackground, 0.05),
  heroPlaceholder: withAlpha(textOnBackground, 0.1),
  menuBackground: background,
  menuSelectedBackground: withAlpha(primary, 0.1),
  menuSelectedBorder: primary,
  menuSelectedText: primary,
  muted: withAlpha(textOnBackground, 0.4),
};
