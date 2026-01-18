import { SPACING, FONT_SIZE } from '@team/constants';
import React from 'react';
import { Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';

import { palette } from '../palette';

import { CenteredContainer } from './CenteredContainer';
import { DEFAULT_EMPTY_MESSAGE, DEFAULT_LOADING_MESSAGE } from './stateMessages';

import type { FlatListProps } from 'react-native';

interface ListWithStatesProps<T> extends Omit<FlatListProps<T>, 'data'> {
  data: T[] | undefined;
  isLoading: boolean;
  error?: string | null;
  emptyMessage?: string;
  loadingMessage?: string;
}

export function ListWithStates<T>({
  data,
  isLoading,
  error,
  emptyMessage = DEFAULT_EMPTY_MESSAGE,
  loadingMessage = DEFAULT_LOADING_MESSAGE,
  ...flatListProps
}: ListWithStatesProps<T>) {
  if (isLoading) {
    return (
      <CenteredContainer>
        <ActivityIndicator size='large' color={palette.accent} />
        <Text style={styles.message}>{loadingMessage}</Text>
      </CenteredContainer>
    );
  }

  if (error) {
    return (
      <CenteredContainer>
        <Text style={styles.errorMessage}>{error}</Text>
      </CenteredContainer>
    );
  }

  if (!data || data.length === 0) {
    return (
      <CenteredContainer>
        <Text style={styles.message}>{emptyMessage}</Text>
      </CenteredContainer>
    );
  }

  return <FlatList data={data} {...flatListProps} />;
}

const styles = StyleSheet.create({
  errorMessage: {
    color: palette.errorText,
    fontSize: FONT_SIZE.LG,
    textAlign: 'center',
  },
  message: {
    color: palette.secondaryText,
    fontSize: FONT_SIZE.LG,
    marginTop: SPACING.MD,
    textAlign: 'center',
  },
});
