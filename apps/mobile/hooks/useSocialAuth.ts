import { ERROR_MESSAGES } from '@team/constants';
import { parseOAuthTokensFromUrl, isUserCancellation, extractOAuthError } from '@team/core-utils';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useState } from 'react';
import { Platform } from 'react-native';

import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

import type { AuthError, Session } from '@supabase/supabase-js';

WebBrowser.maybeCompleteAuthSession();

function handleAuthError(error: unknown): { success: false; error: string } {
  return { success: false, error: extractOAuthError(error) };
}

export const useSocialAuth = () => {
  const [loading, setLoading] = useState(false);
  const supabase = getSupabase();
  const isConfigured = isSupabaseConfigured();

  const signInWithGoogle = useCallback(async () => {
    if (!isConfigured) {
      return {
        success: false,
        error: ERROR_MESSAGES.SUPABASE_NOT_CONFIGURED_EN,
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
          const { accessToken, refreshToken, code } = parseOAuthTokensFromUrl(result.url);

          type SessionResult = {
            session: Session | null;
            user: Session['user'] | null;
          };

          let sessionData: SessionResult | null = null;
          let sessionError: AuthError | null = null;

          if (accessToken && refreshToken) {
            ({ data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
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
      return handleAuthError(error);
    } finally {
      setLoading(false);
    }
  }, [supabase, isConfigured]);

  const signInWithApple = useCallback(async () => {
    if (Platform.OS !== 'ios') {
      return { success: false, error: 'Apple signin is only available on iOS' };
    }

    if (!isConfigured) {
      return {
        success: false,
        error: ERROR_MESSAGES.SUPABASE_NOT_CONFIGURED_EN,
      };
    }

    setLoading(true);
    try {
      // Check if Apple signin is available
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        return {
          success: false,
          error: 'Apple signin is not available on this device',
        };
      }

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        return {
          success: false,
          error: 'Failed to get identity token from Apple',
        };
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
      if (isUserCancellation(error)) {
        return { success: false, error: 'Signin cancelled' };
      }
      return handleAuthError(error);
    } finally {
      setLoading(false);
    }
  }, [supabase, isConfigured]);

  return {
    signInWithGoogle,
    signInWithApple,
    loading,
    isConfigured,
  };
};
