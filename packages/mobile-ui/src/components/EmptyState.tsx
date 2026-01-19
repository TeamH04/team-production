import { FONT_SIZE, SPACING } from '@team/constants';
import { Text, View, StyleSheet, ActivityIndicator } from 'react-native';

import { palette } from '../palette';

interface EmptyStateProps {
  message: string;
  loading?: boolean;
}

export function EmptyState({ message, loading = false }: EmptyStateProps) {
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size='large' />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingVertical: SPACING.XL * 2,
  },
  text: {
    color: palette.mutedText,
    fontSize: FONT_SIZE.LG,
    textAlign: 'center',
  },
});
