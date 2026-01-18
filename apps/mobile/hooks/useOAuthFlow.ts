import { ERROR_MESSAGES } from '@team/constants';
import { parseOAuthTokensFromUrl } from '@team/core-utils';
import { useOAuthState } from '@team/hooks';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useCallback } from 'react';
import { Alert } from 'react-native';

import { useUser } from '@/features/user/UserContext';
import { checkIsOwner, ensureUserExistsInDB } from '@/lib/auth';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

import type { OAuthErrorInfo } from '@team/hooks';
import type { OAuthProvider, UserProfile } from '@team/types';

const OAUTH_CONFIG = {
  SCHEME: 'shopmobile',
  CALLBACK_PATH: 'auth/callback',
} as const;

WebBrowser.maybeCompleteAuthSession();

export interface UseOAuthFlowOptions {
  onLoginSuccess: (isOwner: boolean) => void;
}

/**
 * エラー情報に基づいてプラットフォーム固有のアラートを表示
 */
function showOAuthErrorAlert(errorInfo: OAuthErrorInfo) {
  const { type, message, provider } = errorInfo;

  switch (type) {
    case 'provider_not_configured': {
      const providerName = provider === 'google' ? 'Google/Apple' : 'Apple';
      Alert.alert(
        'プロバイダ未設定',
        `Supabase で ${providerName} のプロバイダが無効です。Authentication > Providers で有効化し、クライアントID/シークレットとリダイレクトURLを設定してください。`,
      );
      break;
    }
    case 'apple_not_available':
      Alert.alert('非対応端末', 'この端末ではAppleによるサインインが利用できません。');
      break;
    default:
      Alert.alert('ログイン失敗', message);
  }
}

/**
 * OAuth認証フローを提供するMobile固有hook
 * 状態管理とエラーハンドリングは@team/hooksのuseOAuthStateを使用
 */
export function useOAuthFlow(options: UseOAuthFlowOptions) {
  const { onLoginSuccess } = options;
  const { setUser } = useUser();

  // 共通hookから状態管理・エラー処理ロジックを取得
  const { loading, setLoading, processOAuthError, isUserCancellation } = useOAuthState({
    onError: showOAuthErrorAlert,
  });

  /**
   * ログイン完了後の共通処理
   */
  const finishLogin = useCallback(async () => {
    await ensureUserExistsInDB();
    const { isOwner } = await checkIsOwner();
    Alert.alert(
      'ログイン完了',
      isOwner ? 'オーナーとしてログインしました。' : '正常にログインしました。',
    );
    onLoginSuccess(isOwner);
  }, [onLoginSuccess]);

  /**
   * ユーザー情報を設定し、ログイン完了処理を実行
   */
  const completeAuth = useCallback(
    async (userData: UserProfile) => {
      setUser(userData);
      await finishLogin();
    },
    [setUser, finishLogin],
  );

  /**
   * WebBrowserでOAuth認証セッションを開き、セッションを設定する
   */
  const executeOAuthSession = useCallback(
    async (authUrl: string, redirectUrl: string): Promise<{ success: boolean }> => {
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

      if (result.type === 'success' && result.url) {
        void WebBrowser.dismissBrowser();
        const { accessToken, refreshToken, code } = parseOAuthTokensFromUrl(result.url);

        if (accessToken && refreshToken) {
          const { error: setErr } = await getSupabase().auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (setErr) throw setErr;
        } else if (code) {
          const { error: exErr } = await getSupabase().auth.exchangeCodeForSession(code);
          if (exErr) throw exErr;
        } else {
          throw new Error('No tokens found in redirect URL');
        }

        return { success: true };
      } else if (result.type === 'dismiss') {
        return { success: false };
      } else {
        throw new Error('Authentication failed');
      }
    },
    [],
  );

  /**
   * OAuthエラーを処理し、適切なアラートを表示
   * 共通hookのprocessOAuthErrorを使用
   */
  const handleOAuthError = useCallback(
    (error: unknown, provider: OAuthProvider) => {
      // processOAuthErrorは内部でonErrorコールバックを呼び出す
      processOAuthError(error, provider);
    },
    [processOAuthError],
  );

  /**
   * Supabase設定チェック
   */
  const checkSupabaseConfigured = useCallback((): boolean => {
    if (!isSupabaseConfigured()) {
      Alert.alert('未設定', ERROR_MESSAGES.SUPABASE_NOT_CONFIGURED);
      return false;
    }
    return true;
  }, []);

  /**
   * リダイレクトURLを生成
   */
  const createRedirectUrl = useCallback(() => {
    return AuthSession.makeRedirectUri({
      scheme: OAUTH_CONFIG.SCHEME,
      path: OAUTH_CONFIG.CALLBACK_PATH,
    });
  }, []);

  /**
   * OAuth URLを取得
   */
  const getOAuthUrl = useCallback(async (provider: OAuthProvider, redirectUrl: string) => {
    const { data, error } = await getSupabase().auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
      },
    });
    if (error) throw error;
    if (!data?.url) throw new Error('OAuth URL not returned');
    return data.url;
  }, []);

  return {
    loading,
    setLoading,
    completeAuth,
    executeOAuthSession,
    handleOAuthError,
    isUserCancellation,
    checkSupabaseConfigured,
    createRedirectUrl,
    getOAuthUrl,
  };
}
