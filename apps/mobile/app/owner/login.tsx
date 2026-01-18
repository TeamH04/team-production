import { Ionicons } from '@expo/vector-icons';
import {
  BORDER_RADIUS,
  ERROR_MESSAGES,
  FONT_WEIGHT,
  isValidEmail,
  LAYOUT,
  ROUTES,
  SESSION_NOT_FOUND,
  SHADOW_STYLES,
  UI_LABELS,
} from '@team/constants';
import { palette } from '@team/mobile-ui';
import { type Href, useNavigation, useRouter } from 'expo-router';
import { useLayoutEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { ensureUserExistsInDB, getSupabase, isSupabaseConfigured } from '@/lib/auth';

export default function OwnerLoginScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions?.({
      title: 'オーナーログイン',
      headerBackTitle: UI_LABELS.LOGIN,
    });
  }, [navigation]);

  const handleLogin = async () => {
    if (loading) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password.trim()) {
      Alert.alert('入力不足', 'メールアドレスとパスワードを入力してください');
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setEmailError(true);
      return;
    }

    setEmailError(false);
    setLoading(true);
    try {
      if (!isSupabaseConfigured()) {
        Alert.alert('未設定', ERROR_MESSAGES.SUPABASE_NOT_CONFIGURED);
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

      try {
        await ensureUserExistsInDB();
      } catch (err) {
        const raw = err instanceof Error ? err.message : 'ログイン処理に失敗しました';
        const message =
          raw === SESSION_NOT_FOUND
            ? 'セッションを取得できませんでした。もう一度ログインしてください。'
            : raw;
        Alert.alert('ログイン失敗', message);
        return;
      }

      Alert.alert('ログイン成功', `${data.user?.email ?? 'メール/パスワード'}でログインしました`);
      router.replace(ROUTES.OWNER as Href);
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
                onChangeText={text => {
                  setEmail(text);
                  setEmailError(false);
                }}
                autoCapitalize='none'
                autoCorrect={false}
                keyboardType='email-address'
                placeholder='owner@example.com'
                placeholderTextColor={palette.tertiaryText}
                style={styles.input}
              />
              {emailError && <Text style={styles.errorText}>※ 正しく入力してください</Text>}
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
                    (pressed || loading) && styles.loginButtonPressed,
                  ]}
                >
                  <Text style={styles.loginButtonText}>
                    {loading ? 'ログイン中…' : UI_LABELS.LOGIN}
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.dividerLine} />

            <Pressable
              onPress={() => router.push(ROUTES.OWNER_SIGNUP as Href)}
              style={({ pressed }) => [styles.secondaryBtn, pressed && styles.secondaryBtnPressed]}
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
    boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.08)',
    elevation: 5,
    marginHorizontal: 24,
    marginVertical: 28,
    maxWidth: 480,
    width: '100%',
  },
  dividerLine: {
    alignSelf: 'stretch',
    backgroundColor: palette.border,
    height: 1,
    marginVertical: 16,
  },
  errorText: { color: palette.dangerBorder, fontSize: 14, marginTop: 4 },
  icon: { marginLeft: 8 },
  input: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: BORDER_RADIUS.MEDIUM,
    borderWidth: 1,
    color: palette.primaryText,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputGroup: { marginBottom: 14 },
  label: { color: palette.secondaryText, fontSize: 12, marginBottom: 6 },
  loginButtonContainer: {
    ...SHADOW_STYLES.DEFAULT,
    backgroundColor: palette.button,
    borderColor: palette.buttonBorder,
    borderRadius: BORDER_RADIUS.PILL,
    borderWidth: 1,
    height: LAYOUT.BUTTON_HEIGHT_MD,
    minWidth: 160,
    overflow: 'hidden',
  },
  loginButtonPressable: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loginButtonPressed: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: palette.surface,
    fontSize: 16,
    fontWeight: FONT_WEIGHT.BOLD,
    height: LAYOUT.BUTTON_HEIGHT_MD,
    lineHeight: LAYOUT.BUTTON_HEIGHT_MD,
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
    borderRadius: BORDER_RADIUS.MEDIUM,
    borderWidth: 1,
    marginTop: 16,
    paddingVertical: 12,
  },
  secondaryBtnPressed: {
    opacity: 0.9,
  },
  secondaryBtnText: {
    color: palette.link,
    fontWeight: FONT_WEIGHT.BOLD,
    textAlign: 'center',
  },
  title: { color: palette.primaryText, fontSize: 20, fontWeight: FONT_WEIGHT.BOLD },
  titleContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
});
