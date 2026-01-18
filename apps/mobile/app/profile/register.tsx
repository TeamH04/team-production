import { ROUTES } from '@team/constants';
import { palette } from '@team/mobile-ui';
import { Stack, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { GENRES } from '@/constants/genres';
import { useUser } from '@/features/user/UserContext';

export default function RegisterProfileScreen() {
  const router = useRouter();
  const { user, setUser } = useUser();
  const name = user?.name ?? '';
  const email = user?.email ?? '';
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  const toggleGenre = (g: string) => {
    setSelectedGenres(prev => (prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]));
  };

  const canSave = useMemo(() => {
    return selectedGenres.length > 0;
  }, [selectedGenres]);

  const onSave = () => {
    if (!user) {
      Alert.alert('ユーザー情報が見つかりません', 'ログインし直してください');
      return;
    }

    setUser({
      ...user,
      name: name,
      email: email,
      isProfileRegistered: true,
      favoriteGenres: selectedGenres,
    });
    router.replace(ROUTES.HOME);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', default: undefined })}
        style={styles.keyboard}
      >
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
          <Text style={styles.title}>ジャンル選択</Text>
          <Text style={styles.subtitle}>自身の選んだ店舗がおすすめに表示されやすくなります</Text>
          <Text style={styles.label}>好きな店舗のジャンル（複数選択可）</Text>
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

          <Pressable
            disabled={!canSave}
            onPress={onSave}
            style={[styles.primaryBtn, !canSave && styles.primaryBtnDisabled]}
          >
            <Text style={styles.primaryBtnText}>登録して続行</Text>
          </Pressable>

          <Pressable onPress={onSave} style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnText}>登録しない</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  // チップ（ジャンル選択）
  chip: {
    borderRadius: 999,
    marginBottom: 8,
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipOff: { backgroundColor: palette.secondarySurface, borderColor: palette.border },
  chipOn: { backgroundColor: palette.accent },

  chipTextOff: { color: palette.primaryText, fontWeight: '700' },

  chipTextOn: { color: palette.primaryOnAccent, fontWeight: '700' },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  content: { padding: 16 },

  keyboard: { flex: 1 },

  label: { color: palette.primaryText, fontWeight: '700', marginBottom: 20, marginTop: 4 },

  // プライマリボタン（登録）
  primaryBtn: {
    backgroundColor: palette.accent,
    borderRadius: 12,
    marginTop: 28,
    paddingVertical: 14,
  },
  primaryBtnDisabled: {
    opacity: 0.5,
  },
  primaryBtnText: { color: palette.primaryOnAccent, fontWeight: '700', textAlign: 'center' },

  screen: { backgroundColor: palette.surface, flex: 1 },

  // セカンドリボタン（非登録）
  secondaryBtn: {
    backgroundColor: palette.secondarySurface,
    borderColor: palette.border,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  secondaryBtnText: { color: palette.primaryText, fontWeight: '700', textAlign: 'center' },

  subtitle: {
    color: palette.secondaryText,
    marginBottom: 16,
    marginTop: 8,
  },
  title: {
    color: palette.primaryText,
    fontSize: 24,
    fontWeight: '700',
  },
});
