import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ERROR_MESSAGES, FONT_WEIGHT, ROUTES } from '@team/constants';
import { DEV_GUEST_FLAG_KEY, DEV_LOGIN_ENABLED } from '@team/constants';
import { createNonce } from '@team/crypto-utils';
import { palette } from '@team/mobile-ui';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { type Href, useRouter } from 'expo-router';
import { useCallback, useLayoutEffect } from 'react';
import { Alert, Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';

import KuguriTitle from '@/assets/icons/kaguri.svg';
import { useOAuthFlow } from '@/hooks/useOAuthFlow';

import type { OAuthProvider } from '@team/types';

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

  useLayoutEffect(() => {
    StatusBar.setBarStyle('dark-content');
  }, []);

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
            name: 'Google User', // ← 仮。後で Supabase から取得
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

      // TODO: Supabase 側で Apple の Services ID / Team ID / Key ID / 秘密鍵 を設定する必要があり
      // Apple ログイン成功後
      const fullName =
        credential.fullName &&
        [credential.fullName.familyName, credential.fullName.givenName]
          .filter(Boolean)
          .join(' ')
          .trim();

      await completeAuth({
        // Apple から取得できた氏名があればそれを優先し、なければ仮の名称を使用
        name: fullName && fullName.length > 0 ? fullName : 'Appleユーザー',
        // email は初回ログイン時のみ返る場合があるため、未提供時は仮のメールアドレスを使用
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
      <View style={styles.logoContainer}>
        <KuguriTitle
          width='70%'
          height='100%'
          preserveAspectRatio='xMidYMid meet'
          accessibilityLabel='Kuguriロゴ'
          fill={palette.white}
        />
      </View>
      <View style={styles.actions}>
        <View style={styles.buttonFrame}>
          <Pressable
            disabled={loading !== null}
            onPress={() => handleOAuth('google')}
            style={({ pressed }) => [
              styles.button,
              styles.buttonOutline,
              pressed && styles.buttonPressed,
              loading === 'google' && styles.buttonLoading,
            ]}
          >
            <View style={styles.buttonContent}>
              <Ionicons name='logo-google' size={28} color={palette.grayDark} />
              <Text style={styles.buttonOutlineText}>
                {loading === 'google' ? 'Google で処理中…' : 'Google でログイン'}
              </Text>
            </View>
          </Pressable>
        </View>
        <View style={styles.buttonFrame}>
          <Pressable
            disabled={loading !== null}
            onPress={handleAppleNative}
            style={({ pressed }) => [
              styles.button,
              styles.buttonOutline,
              pressed && styles.buttonPressed,
              loading === 'apple' && styles.buttonLoading,
            ]}
          >
            <View style={styles.buttonContent}>
              <Ionicons
                name='logo-apple'
                size={28}
                color={palette.grayDark}
                style={styles.appleIconAdjust}
              />
              <Text style={styles.buttonOutlineText}>
                {loading === 'apple' ? 'Apple で処理中…' : 'Apple でログイン'}
              </Text>
            </View>
          </Pressable>
        </View>
      </View>

      <View style={styles.ownerBox}>
        <View style={styles.ownerLead}>
          <View style={styles.ownerLineSide} />
          <Text style={styles.ownerLeadText}>オーナーの方はこちら</Text>
          <View style={styles.ownerLineSide} />
        </View>
        <Pressable onPress={() => router.push(ROUTES.OWNER_LOGIN as Href)}>
          <Text style={styles.ownerLink}>オーナー用アカウントでログイン</Text>
        </Pressable>
      </View>

      {DEV_LOGIN_ENABLED && (
        <View style={styles.devBox}>
          <View style={styles.devHeader}>
            <Ionicons name='construct' size={16} color={palette.action} />
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
              {loading === 'guest' ? 'ゲストで入場中…' : 'ゲストとして入る（開発用）'}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    alignSelf: 'stretch',
    gap: 40,
    marginTop: 40,
    width: '100%',
  },
  appleIconAdjust: {
    position: 'relative',
    top: -3,
  },
  button: {
    borderRadius: 14,
    height: 52,
    justifyContent: 'center',
    width: '100%',
  },
  buttonContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  buttonFrame: {
    alignSelf: 'stretch',
    backgroundColor: palette.grayLight,
    borderRadius: 16,
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  buttonLoading: {
    opacity: 0.75,
  },
  buttonOutline: {
    backgroundColor: palette.transparent,
    borderColor: palette.transparent,
    borderRadius: 14,
    borderWidth: 0,
    overflow: 'hidden',
  },
  buttonOutlineText: {
    color: palette.grayDark,
    fontSize: 20,
    fontWeight: FONT_WEIGHT.BOLD,
    textAlign: 'center',
  },
  buttonPressed: {
    opacity: 0.9,
  },
  devBox: {
    borderColor: palette.border,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 20,
    padding: 14,
  },
  devButton: {
    backgroundColor: palette.outline,
    borderRadius: 10,
    marginTop: 12,
    paddingVertical: 12,
  },
  devButtonLoading: {
    opacity: 0.75,
  },
  devButtonPressed: {
    opacity: 0.9,
  },
  devButtonText: {
    color: palette.black,
    fontWeight: FONT_WEIGHT.BOLD,
    textAlign: 'center',
  },
  devHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  devLead: {
    color: palette.black,
    fontSize: 14,
    fontWeight: FONT_WEIGHT.BOLD,
    marginLeft: 6,
  },
  logoContainer: {
    alignItems: 'center',
    height: 103,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: '25%',
  },
  ownerBox: {
    alignItems: 'center',
    marginTop: 90,
    paddingTop: 20,
  },
  ownerLead: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  ownerLeadText: {
    color: palette.white,
    fontSize: 16,
  },
  ownerLineSide: {
    backgroundColor: palette.grayMid,
    flex: 1,
    height: 1,
  },
  ownerLink: {
    color: palette.white,
    fontSize: 18,
    fontWeight: FONT_WEIGHT.BOLD,
    marginTop: 20,
  },
  screen: {
    alignItems: 'stretch',
    backgroundColor: palette.accent,
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 180,
    paddingHorizontal: 24,
    paddingTop: 0,
  },
});
