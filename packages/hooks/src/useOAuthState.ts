import { extractOAuthError, isUserCancellation as checkUserCancellation } from '@team/core-utils';
import { useCallback, useState } from 'react';

import type { OAuthLoadingState, OAuthProvider } from '@team/types';

// re-export for convenience
export type { OAuthLoadingState, OAuthProvider } from '@team/types';

/**
 * OAuth エラー情報
 */
export interface OAuthErrorInfo {
  type: 'provider_not_configured' | 'apple_not_available' | 'general';
  message: string;
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
 * OAuth認証の状態管理とエラーハンドリングを提供するプラットフォーム非依存hook
 *
 * @example
 * ```tsx
 * // Mobile での使用例
 * const { loading, setLoading, processOAuthError, isUserCancellation } = useOAuthState({
 *   onError: (errorInfo) => {
 *     if (errorInfo.type === 'provider_not_configured') {
 *       Alert.alert('プロバイダ未設定', '...');
 *     } else {
 *       Alert.alert('エラー', errorInfo.message);
 *     }
 *   }
 * });
 *
 * // Web での使用例
 * const { loading, setLoading, processOAuthError } = useOAuthState({
 *   onError: (errorInfo) => {
 *     toast.error(errorInfo.message);
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
      const message = extractOAuthError(error);

      let errorInfo: OAuthErrorInfo;

      if (isProviderNotConfigured(message)) {
        errorInfo = {
          type: 'provider_not_configured',
          message,
          provider,
        };
      } else if (isAppleNotAvailable(message)) {
        errorInfo = {
          type: 'apple_not_available',
          message,
          provider,
        };
      } else {
        errorInfo = {
          type: 'general',
          message,
          provider,
        };
      }

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
