import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useState } from 'react';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

export const useSocialAuth = () => {
  const [loading, setLoading] = useState(false);
  const supabase = getSupabase();

  const signInWithGoogle = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      return {
        success: false,
        error:
          'Supabase is not configured. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.',
      };
    }

    setLoading(true);
    try {
      const redirectUrl = AuthSession.makeRedirectUri({
        scheme: 'shopmobile',
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        throw new Error(`Google signin failed: ${error.message}`);
      }

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

        if (result.type === 'success' && result.url) {
          // Parse tokens from the redirect URL
          const url = new URL(result.url);
          const params = new URLSearchParams(url.hash ? url.hash.substring(1) : url.search);
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');
          const code = params.get('code');
          let sessionData, sessionError;
          if (access_token && refresh_token) {
            ({ data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            }));
          } else if (code) {
            ({ data: sessionData, error: sessionError } =
              await supabase.auth.exchangeCodeForSession(code));
          } else {
            throw new Error('No access_token, refresh_token, or code found in redirect URL');
          }

          if (sessionError || !sessionData.session) {
            throw new Error('Failed to establish session after Google signin');
          }

          return { success: true, user: sessionData.session.user };
        }
      }

      return { success: false, error: 'Google signin cancelled' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const signInWithApple = useCallback(async () => {
    if (Platform.OS !== 'ios') {
      return { success: false, error: 'Apple signin is only available on iOS' };
    }

    if (!isSupabaseConfigured()) {
      return {
        success: false,
        error:
          'Supabase is not configured. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.',
      };
    }

    setLoading(true);
    try {
      // Check if Apple signin is available
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        return { success: false, error: 'Apple signin is not available on this device' };
      }

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        return { success: false, error: 'Failed to get identity token from Apple' };
      }

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });

      if (error) {
        throw new Error(`Apple signin failed: ${error.message}`);
      }

      return { success: true, user: data.user };
    } catch (error) {
      // User cancelled is not an error
      if (error && typeof error === 'object' && 'code' in error) {
        const err = error as { code?: string };
        if (err.code === 'ERR_CANCELED') {
          return { success: false, error: 'Signin cancelled' };
        }
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  return {
    signInWithGoogle,
    signInWithApple,
    loading,
  };
};
