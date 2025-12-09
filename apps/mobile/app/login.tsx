import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import { useRouter, type Href } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { palette } from '@/constants/palette';
import { checkIsOwner } from '@/lib/auth';
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
    return {} as { access_token?: string; refresh_token?: string; code?: string };
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
  const [loading, setLoading] = useState<null | 'google' | 'apple' | 'guest'>(null);

  const finishLogin = useCallback(async () => {
    const { isOwner } = await checkIsOwner();
    Alert.alert(
      'ログイン完了',
      isOwner ? 'オーナーとしてログインしました。' : '正常にログインしました。'
    );
    router.replace((isOwner ? '/owner' : '/(tabs)') as Href);
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
    [finishLogin]
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

      const { error } = await getSupabase().auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
        nonce: rawNonce,
      });
      if (error) throw error;

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
  }, [finishLogin, handleOAuth]);

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
      <View style={styles.cardShadow}>
        <View style={styles.card}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>さぁ、はじめよう</Text>
            <Ionicons
              name='sparkles'
              size={20}
              color={palette.primaryText}
              style={styles.sparkleIcon}
            />
          </View>

          <View style={styles.actions}>
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
                <Ionicons name='logo-google' size={20} color={palette.outline} />
                <Text style={styles.buttonOutlineText}>
                  {loading === 'google' ? 'Google で処理中…' : 'Google で続行'}
                </Text>
              </View>
            </Pressable>
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
                  size={20}
                  color={palette.outline}
                  style={styles.appleIconAdjust}
                />
                <Text style={styles.buttonOutlineText}>
                  {loading === 'apple' ? 'Apple で処理中…' : 'Apple で続行'}
                </Text>
              </View>
            </Pressable>
          </View>

          <View style={styles.ownerBox}>
            <Text style={styles.ownerLead}>オーナーの方はこちら</Text>
            <Pressable onPress={() => router.push('/owner/signup' as Href)}>
              <Text style={styles.ownerLink}>オーナー用アカウントを作成</Text>
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
                  pressed && { opacity: 0.9 },
                  loading === 'guest' && { opacity: 0.75 },
                ]}
              >
                <Text style={styles.devButtonText}>
                  {loading === 'guest' ? 'ゲストで入場中…' : 'ゲストとして入る（開発用）'}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    alignSelf: 'stretch',
    gap: 12,
    marginTop: 32,
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
  buttonLoading: {
    opacity: 0.75,
  },
  buttonOutline: {
    backgroundColor: palette.surface,
    borderColor: palette.outline,
    borderWidth: 1,
  },
  buttonOutlineText: {
    color: palette.outline,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  buttonPressed: {
    opacity: 0.9,
  },
  card: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
  },
  cardShadow: {
    alignSelf: 'center',
    maxWidth: 480,
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    width: '100%',
  },
  devBox: {
    backgroundColor: palette.surface,
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
  devButtonText: {
    color: palette.primaryText,
    fontWeight: '700',
    textAlign: 'center',
  },
  devHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  devLead: {
    color: palette.primaryText,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
  ownerBox: {
    alignItems: 'center',
    borderTopColor: palette.border,
    borderTopWidth: 1,
    marginTop: 32,
    paddingTop: 24,
  },
  ownerLead: {
    color: palette.secondaryText,
    fontSize: 14,
  },
  ownerLink: {
    color: palette.link,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  screen: {
    alignItems: 'stretch',
    backgroundColor: palette.background,
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 40,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  sparkleIcon: {
    marginLeft: 8,
  },
  title: {
    color: palette.primaryText,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
});
