import { Stack, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useUser } from '@/features/user/UserContext';

const GENRES = [
  'カフェ',
  '和食',
  '居酒屋',
  'イタリアン',
  'フレンチ',
  '中華',
  'ベーカリー',
  'バー',
  'スイーツ',
  'その他',
] as const;

const palette = {
  accent: '#0EA5E9',
  avatarBackground: '#DBEAFE',
  avatarText: '#1D4ED8',
  background: '#F9FAFB',
  border: '#E5E7EB',
  muted: '#6B7280',
  primary: '#111827',
  primaryOnAccent: '#FFFFFF',
  secondarySurface: '#F3F4F6',
  surface: '#FFFFFF',
} as const;

export default function RegisterProfileScreen() {
  const router = useRouter();
  const { setUser } = useUser();
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  const toggleGenre = (g: string) => {
    setSelectedGenres(prev => (prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]));
  };

  const canSave = useMemo(() => {
    return selectedGenres.length > 0;
  }, [selectedGenres]);

  const onSave = () => {
    setUser({ isProfileRegistered: true, favoriteGenres: selectedGenres });
    router.replace('/');
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', default: undefined })}
        style={styles.keyboard}
      >
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
          <Text style={[styles.label, { marginTop: 4 }]}>好きな店舗のジャンル（複数選択可）</Text>
          <View style={styles.chipsWrap}>
            {GENRES.map(g => {
              const on = selectedGenres.includes(g);
              return (
                <Pressable
                  key={g}
                  onPress={() => toggleGenre(g)}
                  style={[styles.chip, on ? styles.chipOn : styles.chipOff]}
                >
                  <Text style={on ? styles.chipTextOn : styles.chipTextOff}>{g}</Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable disabled={!canSave} onPress={onSave} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>登録して続行</Text>
          </Pressable>

          <Pressable onPress={onSave} style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnText}>スキップ</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 999,
    marginBottom: 8,
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipOff: { backgroundColor: palette.secondarySurface, borderColor: palette.border },
  chipOn: { backgroundColor: palette.accent },

  chipTextOff: { color: palette.primary, fontWeight: '700' },

  chipTextOn: { color: palette.primaryOnAccent, fontWeight: '700' },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  content: { padding: 16 },

  keyboard: { flex: 1 },

  label: { color: palette.primary, fontWeight: '700', marginBottom: 20 },

  primaryBtn: {
    backgroundColor: palette.accent,
    borderRadius: 12,
    marginTop: 28,
    paddingVertical: 14,
  },
  primaryBtnText: { color: palette.primaryOnAccent, fontWeight: '700', textAlign: 'center' },

  screen: { backgroundColor: palette.surface, flex: 1 },

  secondaryBtn: {
    backgroundColor: palette.secondarySurface,
    borderColor: palette.border,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  secondaryBtnText: { color: palette.primary, fontWeight: '700', textAlign: 'center' },
});
