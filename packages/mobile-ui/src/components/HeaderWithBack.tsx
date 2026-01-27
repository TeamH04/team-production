import { FONT_SIZE, FONT_WEIGHT, SPACING } from '@team/constants';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { palette } from '../palette';

import { BackButton } from './BackButton';

export interface HeaderWithBackProps {
  title: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
}

export function HeaderWithBack({ title, onBack, rightElement }: HeaderWithBackProps) {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <BackButton onPress={onBack} />
      </View>
      <Text style={styles.title} numberOfLines={1} ellipsizeMode='tail'>
        {title}
      </Text>
      <View style={styles.right}>{rightElement}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    position: 'relative',
  },
  left: {
    bottom: 0,
    justifyContent: 'center',
    left: SPACING.MD,
    position: 'absolute',
    top: 0,
  },
  right: {
    bottom: 0,
    justifyContent: 'center',
    position: 'absolute',
    right: SPACING.MD,
    top: 0,
  },
  title: {
    color: palette.primaryText,
    fontSize: FONT_SIZE.LG,
    fontWeight: FONT_WEIGHT.SEMIBOLD,
    maxWidth: '70%',
    textAlign: 'center',
  },
});
