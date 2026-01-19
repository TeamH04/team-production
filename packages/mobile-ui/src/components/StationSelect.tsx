import { BORDER_RADIUS, LAYOUT, SPACING, UI_LABELS } from '@team/constants';
import { fontFamilies } from '@team/theme';
import { type ApiStation } from '@team/types';
import { useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { palette } from '../palette';

interface StationSelectProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (station: string) => void;
  selectedStation?: string;
  stations: ApiStation[];
}

export function StationSelect({
  visible,
  onClose,
  onSelect,
  selectedStation,
  stations,
}: StationSelectProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [selectedLine, setSelectedLine] = useState<string | null>(null);

  const areas = useMemo(() => {
    return Array.from(new Set(stations.map(s => s.kind))).sort();
  }, [stations]);

  const lines = useMemo(() => {
    const lineSet = new Set<string>();
    stations.forEach(s => {
      // Extract line from brackets like (JR), [阪急], 〔ポートライナー〕
      const match = s.name.match(/[（(〔](.+?)[)）〕]/);
      if (match) {
        lineSet.add(match[1]);
      }
    });
    return Array.from(lineSet).sort();
  }, [stations]);

  const filteredStations = useMemo(() => {
    return stations.filter(station => {
      const matchesSearch =
        station.name.includes(searchQuery) || station.kana.includes(searchQuery);
      const matchesArea = selectedArea ? station.kind === selectedArea : true;
      const matchesLine = selectedLine
        ? station.name.includes(`(${selectedLine})`) ||
          station.name.includes(`（${selectedLine}）`) ||
          station.name.includes(`〔${selectedLine}〕`)
        : true;
      return matchesSearch && matchesArea && matchesLine;
    });
  }, [stations, searchQuery, selectedArea, selectedLine]);

  const handleSelect = (stationName: string) => {
    onSelect(stationName);
    onClose();
    setSearchQuery('');
    setSelectedArea(null);
    setSelectedLine(null);
  };

  return (
    <Modal animationType='slide' transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>最寄り駅を選択</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>{UI_LABELS.CLOSE}</Text>
            </Pressable>
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder='駅名・かなで検索'
              placeholderTextColor={palette.tertiaryText}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <View style={styles.filterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              <Pressable
                onPress={() => setSelectedArea(null)}
                style={[styles.filterChip, !selectedArea && styles.filterChipActive]}
              >
                <Text style={[styles.filterText, !selectedArea && styles.filterTextActive]}>
                  全てのエリア
                </Text>
              </Pressable>
              {areas.map(area => (
                <Pressable
                  key={area}
                  onPress={() => setSelectedArea(area === selectedArea ? null : area)}
                  style={[styles.filterChip, selectedArea === area && styles.filterChipActive]}
                >
                  <Text style={[styles.filterText, selectedArea === area && styles.filterTextActive]}>
                    {area}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <View style={styles.filterDivider} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              <Pressable
                onPress={() => setSelectedLine(null)}
                style={[styles.filterChip, !selectedLine && styles.filterChipActive]}
              >
                <Text style={[styles.filterText, !selectedLine && styles.filterTextActive]}>
                  全ての路線
                </Text>
              </Pressable>
              {lines.map(line => (
                <Pressable
                  key={line}
                  onPress={() => setSelectedLine(line === selectedLine ? null : line)}
                  style={[styles.filterChip, selectedLine === line && styles.filterChipActive]}
                >
                  <Text style={[styles.filterText, selectedLine === line && styles.filterTextActive]}>
                    {line}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <ScrollView contentContainerStyle={styles.stationList}>
            {filteredStations.map(station => {
              const isSelected = station.name === selectedStation;
              return (
                <Pressable
                  key={station.id}
                  onPress={() => handleSelect(station.name)}
                  style={[styles.stationChip, isSelected && styles.stationChipSelected]}
                >
                  <Text style={[styles.stationText, isSelected && styles.stationTextSelected]}>
                    {station.name}
                  </Text>
                </Pressable>
              );
            })}
            {filteredStations.length === 0 && (
              <Text style={styles.emptyText}>該当する駅が見つかりません</Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  closeButton: {
    padding: SPACING.SM,
  },
  closeText: {
    color: palette.secondaryText,
    fontFamily: fontFamilies.regular,
    fontSize: 14,
  },
  emptyText: {
    color: palette.secondaryText,
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    marginTop: SPACING.LG,
    textAlign: 'center',
    width: '100%',
  },
  filterChip: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: BORDER_RADIUS.PILL,
    borderWidth: 1,
    marginRight: SPACING.SM,
    paddingHorizontal: SPACING.MD,
    paddingVertical: 6,
  },
  filterChipActive: {
    backgroundColor: palette.accent,
    borderColor: palette.accent,
  },
  filterContainer: {
    marginBottom: SPACING.MD,
  },
  filterDivider: {
    height: SPACING.SM,
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterText: {
    color: palette.secondaryText,
    fontFamily: fontFamilies.medium,
    fontSize: 12,
  },
  filterTextActive: {
    color: palette.primaryOnAccent,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.MD,
  },
  modalContent: {
    backgroundColor: palette.background,
    borderTopLeftRadius: BORDER_RADIUS.LARGE,
    borderTopRightRadius: BORDER_RADIUS.LARGE,
    bottom: 0,
    height: '80%', // Increased height for better list view
    padding: SPACING.LG,
    position: 'absolute',
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  modalOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
  },
  searchContainer: {
    marginBottom: SPACING.MD,
  },
  searchInput: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: BORDER_RADIUS.MEDIUM,
    borderWidth: 1,
    color: palette.primaryText,
    fontFamily: fontFamilies.regular,
    fontSize: 16,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
  },
  stationChip: {
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: BORDER_RADIUS.PILL,
    borderWidth: 1,
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    // width: '30%', // Grid layout ish - Removing fixed width for better chip flow
  },
  stationChipSelected: {
    backgroundColor: palette.accent,
    borderColor: palette.accent,
  },
  stationList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.SM,
    paddingBottom: LAYOUT.TAB_BAR_SPACING,
  },
  stationText: {
    color: palette.primaryText,
    fontFamily: fontFamilies.medium,
    fontSize: 14,
  },
  stationTextSelected: {
    color: palette.primaryOnAccent,
  },
  title: {
    color: palette.primaryText,
    fontFamily: fontFamilies.medium,
    fontSize: 18,
  },
});
