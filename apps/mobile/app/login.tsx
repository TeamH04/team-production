import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ERROR_MESSAGES, FONT_WEIGHT, ROUTES } from '@team/constants';
import { DEV_GUEST_FLAG_KEY, DEV_LOGIN_ENABLED } from '@team/constants';
import { createNonce } from '@team/crypto-utils';
import { palette } from '@team/mobile-ui';
import * as AppleAuthentication from 'expo-apple-authentication';
import { BlurView } from 'expo-blur';
import * as Crypto from 'expo-crypto';
import { type Href, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useLayoutEffect } from 'react';
import { Alert, Dimensions, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import KuguriTitle from '@/assets/icons/kaguri.svg';
import { AnimatedLoginBackground } from '@/components/AnimatedLoginBackground';
import { fonts } from '@/constants/typography';
import { useOAuthFlow } from '@/hooks/useOAuthFlow';

import type { OAuthProvider } from '@team/types';

const { height } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();

  const handleLoginSuccess = useCallback(
    (isOwner: boolean) => {
      // オーナーの場合は直接オーナー画面へ遷移（プロフィール登録をスキップ）
      if (isOwner) {
        router.replace(ROUTES.OWNER as Href);
      }
      // 一般ユーザーの場合は _layout.tsx の useEffect でプロフィール登録画面へリダイレクトされる
    },
    [router],
  );

  const {
    loading,
    setLoading,
    completeAuth,
    executeOAuthSession,
    handleOAuthError,
    isUserCancellation,
    checkSupabaseConfigured,
    createRedirectUrl,
    getOAuthUrl,
  } = useOAuthFlow({ onLoginSuccess: handleLoginSuccess });


  const handleOAuth = useCallback(
    async (provider: OAuthProvider) => {
      if (!checkSupabaseConfigured()) return;

      setLoading(provider);
      try {
        const redirectUrl = createRedirectUrl();
        const authUrl = await getOAuthUrl(provider, redirectUrl);
        const { success } = await executeOAuthSession(authUrl, redirectUrl);

        if (success) {
          await completeAuth({
            name: 'Google User',
            email: 'google@example.com',
            isProfileRegistered: false,
          });
        }
      } catch (e: unknown) {
        handleOAuthError(e, provider);
      } finally {
        setLoading(null);
      }
    },
    [
      checkSupabaseConfigured,
      setLoading,
      createRedirectUrl,
      getOAuthUrl,
      executeOAuthSession,
      completeAuth,
      handleOAuthError,
    ],
  );

  const handleAppleNative = useCallback(async () => {
    if (!checkSupabaseConfigured()) return;

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

      await completeAuth({
        name: fullName && fullName.length > 0 ? fullName : 'Appleユーザー',
        email: credential.email ?? 'apple@example.com',
        isProfileRegistered: false,
      });
    } catch (e: unknown) {
      if (isUserCancellation(e)) return;
      handleOAuthError(e, 'apple');
    } finally {
      setLoading(null);
    }
  }, [
    checkSupabaseConfigured,
    handleOAuth,
    setLoading,
    completeAuth,
    isUserCancellation,
    handleOAuthError,
  ]);

  const handleDevGuestLogin = useCallback(async () => {
    if (!DEV_LOGIN_ENABLED || loading) return;
    setLoading('guest');
    try {
      await AsyncStorage.setItem(DEV_GUEST_FLAG_KEY, 'true');
      router.replace(ROUTES.TABS as Href);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e ?? ERROR_MESSAGES.UNKNOWN);
      Alert.alert('ゲストログイン失敗', msg);
    } finally {
      setLoading(null);
    }
  }, [loading, router, setLoading]);

  return (
    <View style={styles.screen}>
      <StatusBar style='light' />
      <AnimatedLoginBackground />

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
        <Pressable onPress={() => router.push(ROUTES.OWNER_LOGIN as Href)}>
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
