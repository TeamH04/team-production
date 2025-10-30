import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useUser } from '@/features/user/UserContext';

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

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile, updateProfile } = useUser();

  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);

  const canSave = useMemo(() => {
    const emailOk = /.+@.+\..+/.test(email.trim());
    return name.trim().length > 0 && emailOk;
  }, [name, email]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', default: undefined })}
      style={styles.keyboard}
    >
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(name || 'U').slice(0, 2).toUpperCase()}</Text>
        </View>

        <Text style={styles.label}>表示名</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder='例: Hanako Tanaka'
          placeholderTextColor={palette.muted}
          style={styles.input}
          autoCapitalize='words'
        />

        <Text style={styles.label}>メールアドレス</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder='example@domain.com'
          placeholderTextColor={palette.muted}
          style={styles.input}
          autoCapitalize='none'
          keyboardType='email-address'
        />

        <Pressable
          disabled={!canSave}
          onPress={() => {
            updateProfile({ name: name.trim(), email: email.trim() });
            router.back();
          }}
          style={({ pressed }) => [
            styles.primaryBtn,
            (!canSave || pressed) && styles.primaryBtnDimmed,
          ]}
        >
          <Text style={styles.primaryBtnText}>保存</Text>
        </Pressable>

        <Pressable onPress={() => router.back()} style={styles.secondaryBtn}>
          <Text style={styles.secondaryBtnText}>キャンセル</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: palette.avatarBackground,
    borderRadius: 999,
    height: 88,
    justifyContent: 'center',
    marginBottom: 16,
    width: 88,
  },
  avatarText: { color: palette.avatarText, fontSize: 28, fontWeight: '800' },
  content: { padding: 16 },
  input: {
    backgroundColor: palette.background,
    borderColor: palette.border,
    borderRadius: 12,
    borderWidth: 1,
    color: palette.primary,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  keyboard: { flex: 1 },
  label: { color: palette.primary, fontWeight: '700', marginBottom: 8 },
  primaryBtn: { backgroundColor: palette.accent, borderRadius: 12, paddingVertical: 12 },
  primaryBtnDimmed: { opacity: 0.7 },
  primaryBtnText: { color: palette.primaryOnAccent, fontWeight: '700', textAlign: 'center' },
  screen: { backgroundColor: palette.surface, flex: 1 },
  secondaryBtn: {
    backgroundColor: palette.secondarySurface,
    borderColor: palette.border,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  secondaryBtnText: { color: palette.primary, fontWeight: '700', textAlign: 'center' },
});
