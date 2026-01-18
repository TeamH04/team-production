import { extractOAuthError, isUserCancellation as checkUserCancellation } from '@team/core-utils';
import { useCallback, useState } from 'react';

import type { OAuthLoadingState, OAuthProvider } from '@team/types';

/**
 * OAuth エラータイプ
 */
export type OAuthErrorType = 'provider_not_configured' | 'apple_not_available' | 'general';

/**
 * OAuth エラー情報
 */
export interface OAuthErrorInfo {
  /** エラータイプ */
  type: OAuthErrorType;
  /** アラート等に表示するタイトル */
  title: string;
  /** エラーメッセージ */
  message: string;
  /** 関連するOAuthプロバイダ */
  provider?: OAuthProvider;
}

/**
 * useOAuthState のオプション
 */
export interface UseOAuthStateOptions {
  /**
   * エラー発生時のコールバック（プラットフォーム固有のアラート表示用）
   */
  onError?: (errorInfo: OAuthErrorInfo) => void;
}

/**
 * useOAuthState の戻り値
 */
export interface UseOAuthStateResult {
  /** ローディング状態 */
  loading: OAuthLoadingState;
  /** ローディング状態を設定 */
  setLoading: (state: OAuthLoadingState) => void;
  /** エラーを処理し、エラー情報を返す */
  processOAuthError: (error: unknown, provider: OAuthProvider) => OAuthErrorInfo;
  /** ユーザーがキャンセルしたかどうかを判定 */
  isUserCancellation: (error: unknown) => boolean;
  /** プロバイダ未設定エラーかどうかを判定 */
  isProviderNotConfiguredError: (message: string) => boolean;
  /** OAuthエラーからメッセージを抽出 */
  extractOAuthError: (error: unknown) => string;
}

/**
 * プロバイダ未設定エラーかどうかを判定
 */
function isProviderNotConfigured(message: string): boolean {
  return /Unsupported provider|invalid_provider/i.test(message);
}

/**
 * Apple Sign In非対応エラーかどうかを判定
 */
function isAppleNotAvailable(message: string): boolean {
  return /Sign in with Apple is not available/i.test(message);
}

/**
 * エラータイプに応じたタイトルとメッセージを生成
 */
function getErrorTitleAndMessage(
  type: OAuthErrorType,
  originalMessage: string,
  provider?: OAuthProvider,
): { title: string; message: string } {
  switch (type) {
    case 'provider_not_configured': {
      const providerName = provider === 'google' ? 'Google/Apple' : 'Apple';
      return {
        title: 'プロバイダ未設定',
        message: `Supabase で ${providerName} のプロバイダが無効です。Authentication > Providers で有効化し、クライアントID/シークレットとリダイレクトURLを設定してください。`,
      };
    }
    case 'apple_not_available':
      return {
        title: '非対応端末',
        message: 'この端末ではAppleによるサインインが利用できません。',
      };
    default:
      return {
        title: 'ログイン失敗',
        message: originalMessage,
      };
  }
}

/**
 * OAuth認証の状態管理とエラーハンドリングを提供するプラットフォーム非依存hook
 *
 * @example
 * ```tsx
 * // Mobile での使用例
 * const { loading, setLoading, processOAuthError, isUserCancellation } = useOAuthState({
 *   onError: (errorInfo) => {
 *     // title と message がエラータイプに応じて自動生成される
 *     Alert.alert(errorInfo.title, errorInfo.message);
 *   }
 * });
 *
 * // Web での使用例
 * const { loading, setLoading, processOAuthError } = useOAuthState({
 *   onError: (errorInfo) => {
 *     // toast でタイトルとメッセージを表示
 *     toast.error(`${errorInfo.title}: ${errorInfo.message}`);
 *   }
 * });
 * ```
 */
export function useOAuthState(options?: UseOAuthStateOptions): UseOAuthStateResult {
  const [loading, setLoading] = useState<OAuthLoadingState>(null);

  /**
   * ユーザーがキャンセルしたかどうかを判定
   */
  const isUserCancellation = useCallback((error: unknown): boolean => {
    return checkUserCancellation(error);
  }, []);

  /**
   * プロバイダ未設定エラーかどうかを判定
   */
  const isProviderNotConfiguredError = useCallback((message: string): boolean => {
    return isProviderNotConfigured(message);
  }, []);

  /**
   * OAuthエラーを処理し、分類されたエラー情報を返す
   */
  const processOAuthError = useCallback(
    (error: unknown, provider: OAuthProvider): OAuthErrorInfo => {
      const originalMessage = extractOAuthError(error);

      // エラータイプを判定
      let type: OAuthErrorType;
      if (isProviderNotConfigured(originalMessage)) {
        type = 'provider_not_configured';
      } else if (isAppleNotAvailable(originalMessage)) {
        type = 'apple_not_available';
      } else {
        type = 'general';
      }

      // タイトルとメッセージを生成
      const { title, message } = getErrorTitleAndMessage(type, originalMessage, provider);

      const errorInfo: OAuthErrorInfo = {
        type,
        title,
        message,
        provider,
      };

      // コールバックがあれば呼び出す
      options?.onError?.(errorInfo);

      return errorInfo;
    },
    [options],
  );

  return {
    loading,
    setLoading,
    processOAuthError,
    isUserCancellation,
    isProviderNotConfiguredError,
    extractOAuthError,
  };
}
