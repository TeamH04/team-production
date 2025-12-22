import { colors, textOn, withAlpha } from '@team/theme';

const tint = colors.primary;
const iconBase = withAlpha(colors.accent, 0.65);
const text = textOn.background;

export const Colors = {
  light: {
    text,
    background: colors.background,
    tint,
    icon: iconBase,
    tabIconDefault: iconBase,
    tabIconSelected: tint,
  },
  dark: {
    text,
    background: colors.background,
    tint,
    icon: iconBase,
    tabIconDefault: iconBase,
    tabIconSelected: tint,
  },
};
