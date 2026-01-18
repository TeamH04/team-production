import { Text as RNText, type TextProps, StyleSheet } from 'react-native';

import { fonts } from '@/constants/typography';

export type CustomTextProps = TextProps & {
  weight?: 'regular' | 'medium';
};

export function Text({ style, weight = 'regular', ...props }: CustomTextProps) {
  return (
    <RNText
      style={[styles.base, weight === 'medium' ? styles.medium : styles.regular, style]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    fontSize: 16,
  },
  medium: {
    fontFamily: fonts.medium,
  },
  regular: {
    fontFamily: fonts.regular,
  },
});
