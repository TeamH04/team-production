export const colors = {
  primary: '#264053',
  secondary: '#5B6B5A',
  accent: '#595857',
  background: '#F6F5F3',
} as const;

export const textOn = {
  primary: '#FFFFFF',
  secondary: '#FFFFFF',
  accent: '#FFFFFF',
  background: '#264053',
} as const;

// Semantic colors for error states, success, warnings, and providers
export const semanticColors = {
  error: {
    light: '#FEE2E2',
    medium: '#FECACA',
    base: '#EF4444',
    dark: '#DC2626',
  },
  success: {
    base: '#10B981',
  },
  warning: {
    base: '#F59E0B',
  },
  providers: {
    google: '#DB4437',
    apple: '#000000',
  },
} as const;

export type ThemeColor = keyof typeof colors;

export function withAlpha(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  const full =
    normalized.length === 3
      ? normalized
          .split('')
          .map(c => c + c)
          .join('')
      : normalized;
  const int = parseInt(full, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function textColorFor(color: ThemeColor): string {
  return textOn[color];
}

// Mobile UI colors (used by apps/mobile/constants/Colors.ts)
export const mobileUIColors = {
  text: textOn.background,
  background: colors.background,
  tint: colors.primary,
  icon: withAlpha(colors.accent, 0.65),
  tabIconDefault: withAlpha(colors.accent, 0.65),
  tabIconSelected: colors.primary,
} as const;
