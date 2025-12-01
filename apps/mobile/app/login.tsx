import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { makeRedirectUri } from 'expo-auth-session';
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

export default function LoginScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState<null | 'google' | 'apple' | 'guest'>(null);

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
        // expo-auth-session types may lag; explicitly allow `useProxy`
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const redirectUrl = makeRedirectUri({ useProxy: true } as any);
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

          // Decide destination by role
          const { isOwner } = await checkIsOwner();
          Alert.alert(
            'ログイン完了',
            isOwner ? 'オーナーとしてログインしました。' : '正常にログインしました。'
          );
          // Jump directly to the app home stacks to avoid extra redirect hops
          router.replace((isOwner ? '/owner' : '/(tabs)') as Href);
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
    [router]
  );

  const handleDevGuestLogin = useCallback(async () => {
    if (!DEV_LOGIN_ENABLED || loading) return;
    setLoading('guest');
    try {
      await AsyncStorage.setItem(DEV_GUEST_FLAG_KEY, 'true');
      Alert.alert('開発モード', 'ゲストとしてアプリに入ります。');
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
          <Text style={styles.title}>サインイン</Text>

          <View style={styles.actions}>
            <Pressable
              disabled={loading !== null}
              onPress={() => handleOAuth('google')}
              style={({ pressed }) => [
                styles.button,
                styles.buttonOutline,
                pressed && { opacity: 0.9 },
                loading === 'google' && { opacity: 0.75 },
              ]}
            >
              <View style={styles.buttonContent}>
                <Ionicons name='logo-google' size={20} color={palette.outline} />
                <Text style={styles.buttonOutlineText}>
                  {loading === 'google' ? 'Googleで処理中…' : 'Google で続行'}
                </Text>
              </View>
            </Pressable>

            {Platform.OS === 'ios' && (
              <Pressable
                disabled={loading !== null}
                onPress={() => handleOAuth('apple')}
                style={({ pressed }) => [
                  styles.button,
                  styles.apple,
                  pressed && { opacity: 0.95 },
                  loading === 'apple' && { opacity: 0.75 },
                ]}
              >
                <View style={styles.buttonContent}>
                  <Ionicons name='logo-apple' size={20} color={palette.surface} />
                  <Text style={styles.buttonText}>
                    {loading === 'apple' ? 'Appleで処理中…' : 'Apple で続行'}
                  </Text>
                </View>
              </Pressable>
            )}
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
    gap: 12,
    marginTop: 18,
  },
  apple: {
    backgroundColor: palette.apple,
  },
  button: {
    borderRadius: 14,
    paddingVertical: 12,
  },
  buttonContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  buttonOutline: {
    backgroundColor: palette.surface,
    borderColor: palette.outline,
    borderWidth: 1,
  },
  buttonOutlineText: {
    color: palette.outline,
    fontSize: 16,
    fontWeight: '700',
  },
  buttonText: {
    color: palette.surface,
    fontSize: 16,
    fontWeight: '700',
  },
  card: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
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
    marginTop: 20,
    paddingTop: 12,
  },
  ownerLead: {
    color: palette.secondaryText,
    fontSize: 14,
  },
  ownerLink: {
    color: palette.link,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
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
  title: {
    color: palette.primaryText,
    fontSize: 24,
    fontWeight: '700',
  },
});
