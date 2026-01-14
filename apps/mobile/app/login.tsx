import { useUser } from '@/features/user/UserContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import { type Href, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useLayoutEffect, useState } from 'react';
import { Alert, Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';

import KuguriTitle from '@/assets/icons/kaguri.svg';
import { palette } from '@/constants/palette';
import { checkIsOwner, ensureUserExistsInDB } from '@/lib/auth';
import { DEV_GUEST_FLAG_KEY, DEV_LOGIN_ENABLED } from '@/lib/devMode';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

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

export default function LoginScreen() {
  const router = useRouter();
  const { setUser } = useUser();
  const [loading, setLoading] = useState<null | 'google' | 'apple' | 'guest'>(null);

  useLayoutEffect(() => {
    StatusBar.setBarStyle('dark-content');
  }, []);

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
      isOwner ? 'オーナーとしてログインしました。' : '正常にログインしました。'
    );
    // オーナーの場合は直接オーナー画面へ遷移（プロフィール登録をスキップ）
    if (isOwner) {
      router.replace('/owner' as Href);
    }
    // 一般ユーザーの場合は _layout.tsx の useEffect でプロフィール登録画面へリダイレクトされる
  }, [router]);

  const handleOAuth = useCallback(
    async (provider: 'google' | 'apple') => {
      if (!isSupabaseConfigured()) {
        Alert.alert(
          '未設定',
          'Supabaseの環境変数が未設定です。EXPO_PUBLIC_SUPABASE_URL と EXPO_PUBLIC_SUPABASE_ANON_KEY を設定してください。'
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
          // Ensure the in-app browser is closed before navigating (best-effort)
          void WebBrowser.dismissBrowser();
          const { access_token, refresh_token, code } = parseParamsFromUrl(result.url);
          if (access_token && refresh_token) {
            const { error: setErr } = await getSupabase().auth.setSession({
              access_token,
              refresh_token,
            });
            if (setErr) throw setErr;
          } else if (code) {
            // Fallback: exchange authorization code for a session
            const { error: exErr } = await getSupabase().auth.exchangeCodeForSession(code);
            if (exErr) throw exErr;
          } else {
            throw new Error('No tokens found in redirect URL');
          }
          // ログイン成功後に user をセット
          setUser({
            name: 'Google User', // ← 仮。後で Supabase から取得
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
            'Supabase で Google/Apple のプロバイダが無効です。Authentication > Providers で有効化し、クライアントID/シークレットとリダイレクトURL (https://auth.expo.dev/… のプロキシURL) を設定してください。'
          );
        } else {
          Alert.alert('ログイン失敗', msg);
        }
      } finally {
        setLoading(null);
      }
    },
    [finishLogin, setUser]
  );

  const handleAppleNative = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      Alert.alert(
        '未設定',
        'Supabaseの環境変数が未設定です。EXPO_PUBLIC_SUPABASE_URL と EXPO_PUBLIC_SUPABASE_ANON_KEY を設定してください。'
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
        rawNonce
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

      setUser({
        // Apple から取得できた氏名があればそれを優先し、なければ仮の名称を使用
        name: fullName && fullName.length > 0 ? fullName : 'Appleユーザー',
        // email は初回ログイン時のみ返る場合があるため、未提供時は仮のメールアドレスを使用
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
          'Supabase で Apple のプロバイダが無効です。Authentication > Providers で有効化し、クライアントID/シークレットとリダイレクトURLを設定してください。'
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
        <Pressable onPress={() => router.push('/owner/login' as Href)}>
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
    fontWeight: '700',
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
    fontWeight: '700',
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
    fontWeight: '700',
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
    fontWeight: '700',
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
