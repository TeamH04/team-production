/**
 * GenreChipSelector component for selecting multiple genres.
 * Used in profile edit and registration screens.
 */

import {
  BORDER_RADIUS,
  FONT_WEIGHT,
  GENRES,
  toggleGenre as toggleGenreUtil,
} from '@team/constants';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { palette } from '../palette';

import type { Genre } from '@team/constants';

export interface GenreChipSelectorProps {
  /** Currently selected genres */
  selectedGenres: string[];
  /** Callback when selection changes */
  onSelectionChange: (genres: string[]) => void;
  /** Optional label to display above the chips */
  label?: string;
}

/**
 * A chip-based genre selector component.
 * Allows users to select multiple genres from the predefined list.
 */
export function GenreChipSelector({
  selectedGenres,
  onSelectionChange,
  label,
}: GenreChipSelectorProps) {
  const handleToggle = (genre: Genre) => {
    onSelectionChange(toggleGenreUtil(selectedGenres as Genre[], genre));
  };

  return (
    <View>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.chipsWrap}>
        {GENRES.map(genre => {
          const isSelected = selectedGenres.includes(genre);
          return (
            <Pressable
              key={genre}
              onPress={() => handleToggle(genre)}
              style={[styles.chip, isSelected ? styles.chipOn : styles.chipOff]}
              accessibilityRole='checkbox'
              accessibilityState={{ checked: isSelected }}
              accessibilityLabel={`${genre}${isSelected ? ' 選択中' : ''}`}
            >
              <Text style={isSelected ? styles.chipTextOn : styles.chipTextOff}>{genre}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: BORDER_RADIUS.PILL,
    marginBottom: 8,
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipOff: {
    backgroundColor: palette.secondarySurface,
    borderColor: palette.border,
    borderWidth: 1,
  },
  chipOn: {
    backgroundColor: palette.accent,
  },
  chipTextOff: {
    color: palette.primaryText,
    fontWeight: FONT_WEIGHT.BOLD,
  },
  chipTextOn: {
    color: palette.primaryOnAccent,
    fontWeight: FONT_WEIGHT.BOLD,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  label: {
    color: palette.primaryText,
    fontWeight: FONT_WEIGHT.BOLD,
    marginBottom: 8,
  },
});
