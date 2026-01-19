import { SPACING } from '@team/constants';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import type { ReactNode } from 'react';

type CenteredContainerProps = {
  children: ReactNode;
  padding?: number;
  style?: StyleProp<ViewStyle>;
};

export function CenteredContainer({
  children,
  padding = SPACING.LG,
  style,
}: CenteredContainerProps) {
  return <View style={[styles.container, { padding }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});
