import { FONT_SIZE, FONT_WEIGHT, SPACING, UI_LABELS } from '@team/constants';
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { palette } from '../palette';

import type { StyleProp, ViewStyle } from 'react-native';

export type BackButtonProps = {
  onPress?: () => void;
  label?: string;
  style?: StyleProp<ViewStyle>;
};

export function BackButton({ onPress, label = UI_LABELS.BACK, style }: BackButtonProps) {
  return (
    <Pressable onPress={onPress} style={[styles.container, style]}>
      <Text style={styles.icon}>＜</Text>
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: palette.secondarySurface,
    borderRadius: SPACING.LG,
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: SPACING.XS,
  },
  icon: {
    color: palette.primary,
    fontSize: FONT_SIZE.XL,
    fontWeight: FONT_WEIGHT.BOLD,
    marginRight: SPACING.XS,
  },
  text: {
    color: palette.primary,
    fontSize: FONT_SIZE.SM,
    fontWeight: FONT_WEIGHT.SEMIBOLD,
  },
});
