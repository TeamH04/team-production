/**
 * OAuth認証ユーティリティ
 */

import { extractErrorMessage } from './extractErrorMessage';

export interface OAuthTokens {
  accessToken?: string;
  refreshToken?: string;
  code?: string;
  error?: string;
}

/**
 * URLからOAuthトークン/コードを抽出する
 * hashパラメータとqueryパラメータの両方をサポート
 */
export function parseOAuthTokensFromUrl(url: string): OAuthTokens {
  try {
    const u = new URL(url);
    const hash = u.hash.startsWith('#') ? u.hash.substring(1) : u.hash;
    const searchParams = new URLSearchParams(u.search);
    const hashParams = new URLSearchParams(hash);

    const accessToken =
      searchParams.get('access_token') || hashParams.get('access_token') || undefined;
    const refreshToken =
      searchParams.get('refresh_token') || hashParams.get('refresh_token') || undefined;
    const code = searchParams.get('code') || hashParams.get('code') || undefined;
    const error = searchParams.get('error') || hashParams.get('error') || undefined;

    return { accessToken, refreshToken, code, error };
  } catch {
    return {};
  }
}

/**
 * ユーザーがキャンセルしたかどうかを判定
 * expo-auth-sessionやexpo-apple-authenticationのキャンセルエラーを検出
 */
export function isUserCancellation(error: unknown): boolean {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: string }).code;
    return code === 'ERR_REQUEST_CANCELED' || code === 'ERR_CANCELED';
  }
  return false;
}

/**
 * OAuthエラーからエラーメッセージを抽出
 */
export function extractOAuthError(error: unknown): string {
  return extractErrorMessage(error, 'Unknown error occurred');
}
