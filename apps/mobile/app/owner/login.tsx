import { Ionicons } from '@expo/vector-icons';
import { ERROR_MESSAGES, isValidEmail, ROUTES, SESSION_NOT_FOUND } from '@team/constants';
import { extractErrorMessage } from '@team/core-utils';
import { palette } from '@team/mobile-ui';
import { BlurView } from 'expo-blur';
import { type Href, useNavigation, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useLayoutEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import KuguriTitle from '@/assets/icons/kaguri.svg';
import { AnimatedLoginBackground } from '@/components/AnimatedLoginBackground';
import { fonts } from '@/constants/typography';
import { ensureUserExistsInDB, getSupabase, isSupabaseConfigured } from '@/lib/auth';

const { height } = Dimensions.get('window');

export default function OwnerLoginScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions?.({
      headerShown: false,
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
        const raw = extractErrorMessage(err, 'ログイン処理に失敗しました');
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
      <StatusBar style='light' />
      <AnimatedLoginBackground />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps='handled'
      >
        <Animated.View entering={FadeInUp.duration(1000).springify()} style={styles.logoContainer}>
          <KuguriTitle
            width='60%'
            height={80}
            preserveAspectRatio='xMidYMid meet'
            accessibilityLabel='Kuguriロゴ'
            fill={palette.white}
          />
          <Animated.Text entering={FadeInUp.delay(300).duration(800)} style={styles.tagline}>
            オーナー専用ログイン
          </Animated.Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(400).duration(800).springify()}
          style={styles.formContainer}
        >
          <BlurView intensity={20} tint='dark' style={styles.formBlurWrapper}>
            <View style={styles.formContent}>
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
                  placeholderTextColor={palette.placeholderText}
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
                  placeholderTextColor={palette.placeholderText}
                  style={styles.input}
                />
              </View>

              <Pressable
                onPress={handleLogin}
                disabled={loading}
                style={({ pressed }) => [
                  styles.loginButton,
                  pressed && styles.loginButtonPressed,
                  loading && styles.loginButtonLoading,
                ]}
              >
                <Text style={styles.loginButtonText}>{loading ? 'ログイン中…' : 'ログイン'}</Text>
              </Pressable>
            </View>
          </BlurView>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(600).duration(800)} style={styles.signupBox}>
          <View style={styles.signupLead}>
            <View style={styles.signupLineSide} />
            <Text style={styles.signupLeadText}>アカウントをお持ちでない方</Text>
            <View style={styles.signupLineSide} />
          </View>
          <Pressable onPress={() => router.push(ROUTES.OWNER_SIGNUP as Href)}>
            <Text style={styles.signupLink}>新規アカウント作成</Text>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(800).duration(800)} style={styles.backBox}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name='arrow-back' size={18} color={palette.white} />
            <Text style={styles.backText}>戻る</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  backBox: {
    alignItems: 'center',
    marginTop: 20,
  },
  backButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    opacity: 0.8,
  },
  backText: {
    color: palette.white,
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  errorText: {
    color: palette.formErrorText,
    fontFamily: fonts.regular,
    fontSize: 12,
    marginTop: 4,
  },
  formBlurWrapper: {
    backgroundColor: palette.glassBg,
    borderColor: palette.glassBorder,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  formContainer: {
    alignSelf: 'stretch',
    marginTop: 40,
    width: '100%',
  },
  formContent: {
    padding: 24,
  },
  input: {
    backgroundColor: palette.inputBg,
    borderColor: palette.inputBorder,
    borderRadius: 12,
    borderWidth: 1,
    color: palette.white,
    fontFamily: fonts.regular,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: palette.labelText,
    fontFamily: fonts.medium,
    fontSize: 13,
    marginBottom: 8,
  },
  loginButton: {
    alignItems: 'center',
    backgroundColor: palette.loginButtonBg,
    borderColor: palette.loginButtonBorder,
    borderRadius: 30,
    borderWidth: 1,
    height: 52,
    justifyContent: 'center',
    marginTop: 8,
  },
  loginButtonLoading: {
    opacity: 0.75,
  },
  loginButtonPressed: {
    backgroundColor: palette.loginButtonPressedBg,
  },
  loginButtonText: {
    color: palette.white,
    fontFamily: fonts.medium,
    fontSize: 17,
    textShadowColor: palette.glassShadow,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: height * 0.12,
  },
  screen: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  signupBox: {
    alignItems: 'center',
    marginTop: 32,
  },
  signupLead: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    opacity: 0.8,
  },
  signupLeadText: {
    color: palette.white,
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  signupLineSide: {
    backgroundColor: palette.grayLight,
    flex: 1,
    height: 1,
    opacity: 0.5,
  },
  signupLink: {
    color: palette.white,
    fontFamily: fonts.medium,
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  tagline: {
    color: palette.white,
    fontFamily: fonts.regular,
    fontSize: 16,
    letterSpacing: 1.2,
    marginTop: 16,
    opacity: 0.9,
  },
});
