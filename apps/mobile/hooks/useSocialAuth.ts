import { getSupabase } from '@/lib/supabase';
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
    setLoading(true);
    try {
      const redirectUrl = AuthSession.makeRedirectUri({
        scheme: 'myapp',
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

        if (result.type === 'success') {
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

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
      if (error instanceof Error && error.message === 'User cancelled') {
        return { success: false, error: 'Signin cancelled' };
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
