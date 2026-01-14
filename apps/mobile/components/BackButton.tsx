import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';

import { palette } from '@/constants/palette';

type Props = {
  onPress?: () => void;
  label?: string;
  style?: StyleProp<ViewStyle>;
};

export function BackButton({ onPress, label = '戻る', style }: Props) {
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
    borderRadius: 20,
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  icon: {
    color: palette.primary,
    fontSize: 20,
    fontWeight: '700',
    marginRight: 4,
  },
  text: {
    color: palette.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
