/* eslint-disable react-native/no-color-literals */
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { type Href, useNavigation, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useLayoutEffect, useState } from 'react';
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
import Animated, {
  Easing,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import KuguriTitle from '@/assets/icons/kaguri.svg';
import { palette } from '@/constants/palette';
import { fonts } from '@/constants/typography';
import { ensureUserExistsInDB } from '@/lib/auth';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

const { width, height } = Dimensions.get('window');

const isLikelyEmail = (value: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value.trim());

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const MESH_COLORS = {
  base: '#4A5749',
  accent1: '#5B6B5A',
  accent2: '#7A8C79',
  accent3: '#3D473C',
};

const FloatingCircle = ({
  cx,
  cy,
  r,
  duration,
  delay,
}: {
  cx: number;
  cy: number;
  r: number;
  duration: number;
  delay: number;
}) => {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withSequence(
        withTiming(-5, { duration: duration / 2, easing: Easing.inOut(Easing.ease) }),
        withRepeat(withTiming(5, { duration, easing: Easing.inOut(Easing.ease) }), -1, true),
      ),
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(0.9, { duration: duration * 0.8, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      ),
    );
  }, [delay, duration, opacity, translateY]);

  const animatedProps = useAnimatedStyle(() => ({
    cy: cy + translateY.value,
    opacity: opacity.value,
  }));

  return (
    <AnimatedCircle
      cx={cx}
      cy={animatedProps.cy}
      r={r}
      fill='url(#star_grad)'
      opacity={animatedProps.opacity}
    />
  );
};

const AnimatedMeshBlob = ({
  initialX,
  initialY,
  size,
  color,
  duration,
}: {
  initialX: number;
  initialY: number;
  size: number;
  color: string;
  duration: number;
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(Math.random() * 100 - 50, { duration, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    translateY.value = withRepeat(
      withTiming(Math.random() * 100 - 50, {
        duration: duration * 1.2,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
    scale.value = withRepeat(
      withTiming(1.3, { duration: duration * 0.8, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [duration, scale, translateX, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value + initialX },
      { translateY: translateY.value + initialY },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.blob,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
};

const AnimatedBackground = () => {
  return (
    <View style={[StyleSheet.absoluteFill, styles.backgroundContainer]}>
      <AnimatedMeshBlob
        initialX={-width * 0.2}
        initialY={-height * 0.1}
        size={width * 1.2}
        color={MESH_COLORS.accent1}
        duration={10000}
      />
      <AnimatedMeshBlob
        initialX={width * 0.5}
        initialY={height * 0.3}
        size={width * 1.5}
        color={MESH_COLORS.accent2}
        duration={15000}
      />
      <AnimatedMeshBlob
        initialX={width * 0.1}
        initialY={height * 0.7}
        size={width * 1.3}
        color={MESH_COLORS.accent3}
        duration={12000}
      />

      <View style={[StyleSheet.absoluteFill, styles.overlay]} />

      <Svg height='100%' width='100%' style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id='star_grad' cx='50%' cy='50%' r='50%'>
            <Stop offset='0%' stopColor='white' stopOpacity='0.8' />
            <Stop offset='100%' stopColor='white' stopOpacity='0' />
          </RadialGradient>
        </Defs>
        <FloatingCircle cx={width * 0.3} cy={height * 0.2} r={2} duration={3000} delay={0} />
        <FloatingCircle cx={width * 0.7} cy={height * 0.4} r={1.5} duration={4000} delay={500} />
        <FloatingCircle cx={width * 0.1} cy={height * 0.8} r={2.5} duration={5000} delay={1000} />
        <FloatingCircle cx={width * 0.9} cy={height * 0.1} r={1.2} duration={3500} delay={200} />
        <FloatingCircle cx={width * 0.5} cy={height * 0.6} r={2} duration={4500} delay={800} />
      </Svg>
    </View>
  );
};

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

    if (!isLikelyEmail(trimmedEmail)) {
      setEmailError(true);
      return;
    }

    setEmailError(false);
    setLoading(true);
    try {
      if (!isSupabaseConfigured()) {
        Alert.alert(
          '未設定',
          'Supabaseの環境変数が未設定です。EXPO_PUBLIC_SUPABASE_URL と EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY を設定してください。',
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

      try {
        await ensureUserExistsInDB();
      } catch (err) {
        const raw = err instanceof Error ? err.message : 'ログイン処理に失敗しました';
        const message =
          raw === 'session_not_found'
            ? 'セッションを取得できませんでした。もう一度ログインしてください。'
            : raw;
        Alert.alert('ログイン失敗', message);
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
      <StatusBar style='light' />
      <AnimatedBackground />

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
                  placeholderTextColor='rgba(255, 255, 255, 0.4)'
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
                  placeholderTextColor='rgba(255, 255, 255, 0.4)'
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
          <Pressable onPress={() => router.push('/owner/signup' as Href)}>
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
  backgroundContainer: {
    backgroundColor: MESH_COLORS.base,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
  },
  errorText: {
    color: '#FCA5A5',
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
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
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: fonts.medium,
    fontSize: 13,
    marginBottom: 8,
  },
  loginButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
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
  overlay: {
    backgroundColor: palette.overlay,
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
