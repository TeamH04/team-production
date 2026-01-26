import { BORDER_RADIUS, FONT_SIZE, SPACING } from '@team/constants';
import { fontFamilies } from '@team/theme';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { palette } from '../palette';

import type React from 'react';

interface ToggleButtonProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  size?: 'small' | 'medium';
}

export function ToggleButton({
  label,
  isActive,
  onPress,
  style,
  size = 'medium',
}: ToggleButtonProps): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.button,
        size === 'small' && styles.buttonSmall,
        isActive ? styles.buttonActive : styles.buttonInactive,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          size === 'small' && styles.textSmall,
          isActive ? styles.textActive : styles.textInactive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: BORDER_RADIUS.MEDIUM,
    borderWidth: 1,
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.SM,
  },
  buttonActive: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  buttonInactive: {
    backgroundColor: palette.transparent,
    borderColor: palette.border,
  },
  buttonSmall: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: 6,
  },
  text: {
    fontFamily: fontFamilies.medium,
    fontSize: FONT_SIZE.MD,
  },
  textActive: {
    color: palette.white,
  },
  textInactive: {
    color: palette.secondaryText,
  },
  textSmall: {
    fontSize: FONT_SIZE.XS,
  },
});
