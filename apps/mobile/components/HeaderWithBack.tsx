import { SPACING, FONT_SIZE } from '@team/constants';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { palette } from '@/constants/palette';

import { BackButton } from './BackButton';

interface HeaderWithBackProps {
  title: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
}

export function HeaderWithBack({ title, onBack, rightElement }: HeaderWithBackProps) {
  return (
    <View style={styles.container}>
      <BackButton onPress={onBack} />
      <Text style={styles.title}>{title}</Text>
      {rightElement ?? <View style={styles.spacer} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
  },
  spacer: {
    width: 40, // BackButtonと同じ幅でバランス
  },
  title: {
    color: palette.primaryText,
    flex: 1,
    fontSize: FONT_SIZE.LG,
    fontWeight: '600',
    textAlign: 'center',
  },
});
