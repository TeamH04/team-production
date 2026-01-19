import { BORDER_RADIUS, ROUTES } from '@team/constants';
import { GenreChipSelector, palette } from '@team/mobile-ui';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fonts } from '@/constants/typography';
import { useUser } from '@/features/user/UserContext';

export default function RegisterProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, setUser } = useUser();
  const name = user?.name ?? '';
  const email = user?.email ?? '';
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

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
        <ScrollView
          style={styles.screen}
          contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        >
          <View style={styles.headerContainer}>
            <Text style={styles.title}>ジャンル選択</Text>
          </View>
          <Text style={styles.subtitle}>自身の選んだ店舗がおすすめに表示されやすくなります</Text>
          <GenreChipSelector
            selectedGenres={selectedGenres}
            onSelectionChange={setSelectedGenres}
            label='好きな店舗のジャンル（複数選択可）'
          />

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
  content: { padding: 16 },

  headerContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },

  keyboard: { flex: 1 },

  // プライマリボタン（登録）
  primaryBtn: {
    backgroundColor: palette.accent,
    borderRadius: BORDER_RADIUS.MEDIUM,
    marginTop: 28,
    paddingVertical: 14,
  },
  primaryBtnDisabled: {
    opacity: 0.5,
  },
  primaryBtnText: {
    color: palette.primaryOnAccent,
    fontFamily: fonts.medium,
    textAlign: 'center',
  },

  screen: { backgroundColor: palette.surface, flex: 1 },

  // セカンドリボタン（非登録）
  secondaryBtn: {
    backgroundColor: palette.secondarySurface,
    borderColor: palette.border,
    borderRadius: BORDER_RADIUS.MEDIUM,
    borderWidth: 1,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  secondaryBtnText: {
    color: palette.primaryText,
    fontFamily: fonts.medium,
    textAlign: 'center',
  },

  subtitle: {
    color: palette.secondaryText,
    fontFamily: fonts.regular,
    marginBottom: 16,
    marginTop: 8,
  },

  title: {
    color: palette.primaryText,
    fontFamily: fonts.medium,
    fontSize: 24,
  },
});
