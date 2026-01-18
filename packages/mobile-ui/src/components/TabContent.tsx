import { FONT_SIZE, SPACING } from '@team/constants';
import { StyleSheet, Text, View } from 'react-native';

import { palette } from '../palette';

import { CenteredContainer } from './CenteredContainer';
import { DEFAULT_LOADING_MESSAGE } from './stateMessages';

import type { ReactElement, ReactNode } from 'react';

interface TabContentProps<T> {
  isLoading?: boolean;
  loadingText?: string;
  items: T[];
  emptyText: string;
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor?: (item: T, index: number) => string;
}

export function TabContent<T>({
  isLoading = false,
  loadingText = DEFAULT_LOADING_MESSAGE,
  items,
  emptyText,
  renderItem,
  keyExtractor,
}: TabContentProps<T>): ReactElement {
  if (isLoading) {
    return (
      <CenteredContainer padding={SPACING.XL}>
        <Text style={styles.text}>{loadingText}</Text>
      </CenteredContainer>
    );
  }

  if (items.length === 0) {
    return (
      <CenteredContainer padding={SPACING.XL}>
        <Text style={styles.text}>{emptyText}</Text>
      </CenteredContainer>
    );
  }

  return (
    <View style={styles.container}>
      {items.map((item, index) => (
        <View key={keyExtractor?.(item, index) ?? String(index)}>{renderItem(item, index)}</View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  text: {
    color: palette.secondaryText,
    fontSize: FONT_SIZE.MD,
  },
});
