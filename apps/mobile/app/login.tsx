import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import { BlurView } from 'expo-blur';
import * as Crypto from 'expo-crypto';
import { type Href, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Dimensions, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
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
import { useUser } from '@/features/user/UserContext';
import { checkIsOwner, ensureUserExistsInDB } from '@/lib/auth';
import { DEV_GUEST_FLAG_KEY, DEV_LOGIN_ENABLED } from '@/lib/devMode';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get('window');

function parseParamsFromUrl(url: string) {
  try {
    const u = new URL(url);
    const hash = u.hash.startsWith('#') ? u.hash.substring(1) : u.hash;
    const searchParams = new URLSearchParams(u.search);
    const hashParams = new URLSearchParams(hash);

    const access_token =
      searchParams.get('access_token') || hashParams.get('access_token') || undefined;
    const refresh_token =
      searchParams.get('refresh_token') || hashParams.get('refresh_token') || undefined;
    const code = searchParams.get('code') || hashParams.get('code') || undefined;
    return { access_token, refresh_token, code };
  } catch {
    return {} as {
      access_token?: string;
      refresh_token?: string;
      code?: string;
    };
  }
}

function createNonce(length = 32) {
  const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const randomValues =
    typeof globalThis.crypto?.getRandomValues === 'function'
      ? globalThis.crypto.getRandomValues(new Uint8Array(length))
      : Crypto.getRandomBytes(length);
  return Array.from(randomValues, v => charset[v % charset.length])
    .slice(0, length)
    .join('');
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ふわふわ浮く円のアニメーションコンポーネント（星のエフェクト）
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

// 背景のアニメーション用の定数
const MESH_COLORS = {
  base: '#4A5749', // 少し濃いグリーン
  accent1: '#5B6B5A', // メインのグリーン
  accent2: '#7A8C79', // 少し明るいグリーン
  accent3: '#3D473C', // 深いグリーン
  highlight: '#ffffff15', // 控えめな輝き
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
      {/* メッシュグラデーションを構成する光の塊 */}
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

      {/* 画面全体に薄いオーバーレイをかけて色を馴染ませる */}
      <View style={[StyleSheet.absoluteFill, styles.overlay]} />

      <Svg height='100%' width='100%' style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id='star_grad' cx='50%' cy='50%' r='50%'>
            <Stop offset='0%' stopColor='white' stopOpacity='0.8' />
            <Stop offset='100%' stopColor='white' stopOpacity='0' />
          </RadialGradient>
        </Defs>
        {/* 星のような小さな瞬き */}
        <FloatingCircle cx={width * 0.3} cy={height * 0.2} r={2} duration={3000} delay={0} />
        <FloatingCircle cx={width * 0.7} cy={height * 0.4} r={1.5} duration={4000} delay={500} />
        <FloatingCircle cx={width * 0.1} cy={height * 0.8} r={2.5} duration={5000} delay={1000} />
        <FloatingCircle cx={width * 0.9} cy={height * 0.1} r={1.2} duration={3500} delay={200} />
        <FloatingCircle cx={width * 0.5} cy={height * 0.6} r={2} duration={4500} delay={800} />
      </Svg>
    </View>
  );
};

export default function LoginScreen() {
  const router = useRouter();
  const { setUser } = useUser();
  const [loading, setLoading] = useState<null | 'google' | 'apple' | 'guest'>(null);

  const finishLogin = useCallback(async () => {
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

    const { isOwner } = await checkIsOwner();
    Alert.alert(
      'ログイン完了',
      isOwner ? 'オーナーとしてログインしました。' : '正常にログインしました。',
    );
    if (isOwner) {
      router.replace('/owner' as Href);
    }
  }, [router]);

  const handleOAuth = useCallback(
    async (provider: 'google' | 'apple') => {
      if (!isSupabaseConfigured()) {
        Alert.alert(
          '未設定',
          'Supabaseの環境変数が未設定です。EXPO_PUBLIC_SUPABASE_URL と EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY を設定してください。',
        );
        return;
      }

      setLoading(provider);
      try {
        const redirectUrl = AuthSession.makeRedirectUri({
          scheme: 'shopmobile',
          path: 'auth/callback',
        });
        const { data, error } = await getSupabase().auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: redirectUrl,
            skipBrowserRedirect: true,
          },
        });
        if (error) throw error;
        if (!data?.url) throw new Error('OAuth URL not returned');

        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
        if (result.type === 'success' && result.url) {
          void WebBrowser.dismissBrowser();
          const { access_token, refresh_token, code } = parseParamsFromUrl(result.url);
          if (access_token && refresh_token) {
            const { error: setErr } = await getSupabase().auth.setSession({
              access_token,
              refresh_token,
            });
            if (setErr) throw setErr;
          } else if (code) {
            const { error: exErr } = await getSupabase().auth.exchangeCodeForSession(code);
            if (exErr) throw exErr;
          } else {
            throw new Error('No tokens found in redirect URL');
          }
          setUser({
            name: 'Google User',
            email: 'google@example.com',
            isProfileRegistered: false,
          });

          await finishLogin();
        } else if (result.type === 'dismiss') {
          // user cancelled
        } else {
          throw new Error('Authentication failed');
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e ?? 'Unknown error');
        if (/Unsupported provider|invalid_provider/i.test(msg)) {
          Alert.alert(
            'プロバイダ未設定',
            'Supabase で Google/Apple のプロバイダが無効です。Authentication > Providers で有効化し、クライアントID/シークレットとリダイレクトURL (https://auth.expo.dev/… のプロキシURL) を設定してください。',
          );
        } else {
          Alert.alert('ログイン失敗', msg);
        }
      } finally {
        setLoading(null);
      }
    },
    [finishLogin, setUser],
  );

  const handleAppleNative = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      Alert.alert(
        '未設定',
        'Supabaseの環境変数が未設定です。EXPO_PUBLIC_SUPABASE_URL と EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY を設定してください。',
      );
      return;
    }

    if (Platform.OS !== 'ios') {
      return handleOAuth('apple');
    }

    const isAppleAvailable = await AppleAuthentication.isAvailableAsync();
    if (!isAppleAvailable) {
      return handleOAuth('apple');
    }

    setLoading('apple');
    try {
      const rawNonce = createNonce();
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce,
      );
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (!credential.identityToken) {
        throw new Error('Appleの認証トークンを取得できませんでした。');
      }

      const fullName =
        credential.fullName &&
        [credential.fullName.familyName, credential.fullName.givenName]
          .filter(Boolean)
          .join(' ')
          .trim();

      setUser({
        name: fullName && fullName.length > 0 ? fullName : 'Appleユーザー',
        email: credential.email ?? 'apple@example.com',
        isProfileRegistered: false,
      });

      await finishLogin();
    } catch (e: unknown) {
      if (
        typeof e === 'object' &&
        e !== null &&
        'code' in e &&
        ((e as { code?: string }).code === 'ERR_REQUEST_CANCELED' ||
          (e as { code?: string }).code === 'ERR_CANCELED')
      ) {
        return;
      }

      const msg = e instanceof Error ? e.message : String(e ?? 'Unknown error');
      if (/Unsupported provider|invalid_provider/i.test(msg)) {
        Alert.alert(
          'プロバイダ未設定',
          'Supabase で Apple のプロバイダが無効です。Authentication > Providers で有効化し、クライアントID/シークレットとリダイレクトURLを設定してください。',
        );
      } else if (/Sign in with Apple is not available/i.test(msg)) {
        Alert.alert('非対応端末', 'この端末ではAppleによるサインインが利用できません。');
      } else {
        Alert.alert('ログイン失敗', msg);
      }
    } finally {
      setLoading(null);
    }
  }, [finishLogin, handleOAuth, setUser]);

  const handleDevGuestLogin = useCallback(async () => {
    if (!DEV_LOGIN_ENABLED || loading) return;
    setLoading('guest');
    try {
      await AsyncStorage.setItem(DEV_GUEST_FLAG_KEY, 'true');
      router.replace('/(tabs)' as Href);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e ?? 'Unknown error');
      Alert.alert('ゲストログイン失敗', msg);
    } finally {
      setLoading(null);
    }
  }, [loading, router]);

  return (
    <View style={styles.screen}>
      <StatusBar style='light' />
      <AnimatedBackground />

      <Animated.View entering={FadeInUp.duration(1000).springify()} style={styles.logoContainer}>
        <KuguriTitle
          width='70%'
          height={100}
          preserveAspectRatio='xMidYMid meet'
          accessibilityLabel='Kuguriロゴ'
          fill={palette.white}
        />
        <Animated.Text entering={FadeInUp.delay(300).duration(800)} style={styles.tagline}>
          最高のおもてなしを、ここから。
        </Animated.Text>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(600).duration(800).springify()}
        style={styles.actions}
      >
        <BlurView intensity={20} tint='dark' style={styles.buttonBlurWrapper}>
          <Pressable
            disabled={loading !== null}
            onPress={() => handleOAuth('google')}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
              loading === 'google' && styles.buttonLoading,
            ]}
          >
            <View style={styles.buttonContent}>
              <Ionicons name='logo-google' size={24} color={palette.white} />
              <Text style={styles.buttonText}>
                {loading === 'google' ? '処理中…' : 'Google ではじめる'}
              </Text>
            </View>
          </Pressable>
        </BlurView>
        <BlurView intensity={20} tint='dark' style={styles.buttonBlurWrapper}>
          <Pressable
            disabled={loading !== null}
            onPress={handleAppleNative}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
              loading === 'apple' && styles.buttonLoading,
            ]}
          >
            <View style={styles.buttonContent}>
              <Ionicons
                name='logo-apple'
                size={24}
                color={palette.white}
                style={styles.appleIconAdjust}
              />
              <Text style={styles.buttonText}>
                {loading === 'apple' ? '処理中…' : 'Apple ではじめる'}
              </Text>
            </View>
          </Pressable>
        </BlurView>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(800).duration(800)} style={styles.ownerBox}>
        <View style={styles.ownerLead}>
          <View style={styles.ownerLineSide} />
          <Text style={styles.ownerLeadText}>オーナーの方はこちら</Text>
          <View style={styles.ownerLineSide} />
        </View>
        <Pressable onPress={() => router.push('/owner/login' as Href)}>
          <Text style={styles.ownerLink}>オーナー用アカウントでログイン</Text>
        </Pressable>
      </Animated.View>

      {DEV_LOGIN_ENABLED && (
        <Animated.View entering={FadeInDown.delay(1000).duration(800)} style={styles.devBox}>
          <View style={styles.devHeader}>
            <Ionicons name='construct' size={16} color={palette.white} />
            <Text style={styles.devLead}>開発者モード</Text>
          </View>
          <Pressable
            disabled={loading !== null}
            onPress={handleDevGuestLogin}
            style={({ pressed }) => [
              styles.devButton,
              pressed && styles.devButtonPressed,
              loading === 'guest' && styles.devButtonLoading,
            ]}
          >
            <Text style={styles.devButtonText}>
              {loading === 'guest' ? 'ゲストで入場中…' : 'ゲストとして入る'}
            </Text>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    alignSelf: 'stretch',
    gap: 16,
    marginTop: 60,
    width: '100%',
  },
  appleIconAdjust: {
    position: 'relative',
    top: -2,
  },
  backgroundContainer: {
    backgroundColor: MESH_COLORS.base,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
  },
  button: {
    borderRadius: 36,
    height: 72,
    justifyContent: 'center',
    width: '100%',
  },
  buttonBlurWrapper: {
    backgroundColor: palette.glassBg,
    borderColor: palette.glassBorder,
    borderRadius: 36,
    borderWidth: 1,
    height: 48,
    overflow: 'hidden',
  },
  buttonContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  buttonLoading: {
    opacity: 0.75,
  },
  buttonPressed: {
    backgroundColor: palette.glassPressed,
  },
  buttonText: {
    color: palette.white,
    fontFamily: fonts.medium,
    fontSize: 17,
    textAlign: 'center',
    textShadowColor: palette.glassShadow,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  devBox: {
    backgroundColor: palette.devBoxBg,
    borderColor: palette.devBoxBorder,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 30,
    padding: 14,
  },
  devButton: {
    backgroundColor: palette.devButtonBg,
    borderRadius: 10,
    marginTop: 10,
    paddingVertical: 10,
  },
  devButtonLoading: {
    opacity: 0.75,
  },
  devButtonPressed: {
    backgroundColor: palette.devButtonPressed,
  },
  devButtonText: {
    color: palette.white,
    fontFamily: fonts.medium,
    fontSize: 14,
    textAlign: 'center',
  },
  devHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  devLead: {
    color: palette.white,
    fontFamily: fonts.medium,
    fontSize: 14,
    marginLeft: 6,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    marginTop: height * 0.25,
  },
  overlay: {
    backgroundColor: palette.overlay,
  },
  ownerBox: {
    alignItems: 'center',
    marginTop: 40,
    paddingTop: 10,
  },
  ownerLead: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    opacity: 0.8,
  },
  ownerLeadText: {
    color: palette.white,
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  ownerLineSide: {
    backgroundColor: palette.grayLight,
    flex: 1,
    height: 1,
    opacity: 0.5,
  },
  ownerLink: {
    color: palette.white,
    fontFamily: fonts.medium,
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  screen: {
    flex: 1,
    paddingBottom: 40,
    paddingHorizontal: 24,
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
