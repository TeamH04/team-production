import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRouter, type Href } from 'expo-router';
import React, { useLayoutEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { palette } from '@/constants/palette';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

const isLikelyEmail = (value: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value.trim());

export default function OwnerLoginScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions?.({
      title: 'オーナーログイン',
      headerBackTitle: 'ログイン',
    });
  }, [navigation]);

  const handleLogin = async () => {
    if (loading) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password.trim()) {
      Alert.alert('入力不足', 'メールアドレスとパスワードを入力してください');
      return;
    }

    if (!isLikelyEmail(trimmedEmail)) {
      Alert.alert('入力エラー', '正式なメールアドレスを入力してください');
      return;
    }

    setLoading(true);
    try {
      if (!isSupabaseConfigured()) {
        Alert.alert(
          '未設定',
          'Supabaseの環境変数が未設定です。EXPO_PUBLIC_SUPABASE_URL と EXPO_PUBLIC_SUPABASE_ANON_KEY を設定してください。'
        );
        return;
      }

      const { data, error } = await getSupabase().auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        const msg = /invalid/i.test(error.message)
          ? 'メールアドレスまたはパスワードが正しくありません。再度入力してください。'
          : error.message;
        Alert.alert('ログイン失敗', msg);
        return;
      }

      Alert.alert('ログイン成功', `${data.user?.email ?? 'メール/パスワード'}でログインしました`);
      router.replace('/owner' as Href);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.cardShadow}>
          <View style={styles.card}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>オーナーログイン</Text>
              <Ionicons
                name='person-circle'
                size={20}
                color={palette.primaryText}
                style={styles.icon}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>メールアドレス</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize='none'
                autoCorrect={false}
                keyboardType='email-address'
                placeholder='owner@example.com'
                placeholderTextColor={palette.tertiaryText}
                style={styles.input}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>パスワード</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder='••••••••'
                placeholderTextColor={palette.tertiaryText}
                style={styles.input}
              />
            </View>

            <View style={styles.loginButtonWrapper}>
              <View style={styles.loginButtonContainer}>
                <Pressable
                  onPress={handleLogin}
                  disabled={loading}
                  style={({ pressed }) => [
                    styles.loginButtonPressable,
                    (pressed || loading) && { opacity: 0.7 },
                  ]}
                >
                  <Text style={styles.loginButtonText}>{loading ? 'ログイン中…' : 'ログイン'}</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.dividerLine} />

            <Pressable
              onPress={() => router.push('/owner/signup' as Href)}
              style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.9 }]}
            >
              <Text style={styles.secondaryBtnText}>アカウントを新規作成</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    backgroundColor: palette.surface,
    borderRadius: 16,
    padding: 24,
  },
  cardShadow: {
    alignSelf: 'center',
    elevation: 5,
    marginHorizontal: 24,
    marginVertical: 28,
    maxWidth: 480,
    shadowColor: palette.shadow,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    width: '100%',
  },
  dividerLine: {
    alignSelf: 'stretch',
    backgroundColor: palette.border,
    height: 1,
    marginVertical: 16,
  },
  icon: { marginLeft: 8 },
  input: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 12,
    borderWidth: 1,
    color: palette.primaryText,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputGroup: { marginBottom: 14 },
  label: { color: palette.secondaryText, fontSize: 12, marginBottom: 6 },
  loginButtonContainer: {
    backgroundColor: palette.button,
    borderColor: palette.buttonBorder,
    borderRadius: 999,
    borderWidth: 1,
    elevation: 4,
    height: 44,
    minWidth: 160,
    overflow: 'hidden',
    shadowColor: palette.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
  },
  loginButtonPressable: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loginButtonText: {
    color: palette.surface,
    fontSize: 16,
    fontWeight: '700',
    height: 44,
    lineHeight: 44,
    textAlign: 'center',
  },
  loginButtonWrapper: {
    alignItems: 'center',
    marginTop: 24,
  },
  screen: {
    alignItems: 'center',
    backgroundColor: palette.background,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  scrollContent: {
    alignItems: 'center',
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  secondaryBtn: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 16,
    paddingVertical: 12,
  },
  secondaryBtnText: { color: palette.link, fontWeight: '700', textAlign: 'center' },
  title: { color: palette.primaryText, fontSize: 20, fontWeight: '800' },
  titleContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
});
