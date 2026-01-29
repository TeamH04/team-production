/**
 * デフォルトのAPIポート番号
 */
export const DEFAULT_API_PORT = '8080';

/**
 * デフォルトのAPIパス
 */
export const DEFAULT_API_PATH = '/api';

/**
 * デフォルトのAPIベースURL
 */
export const DEFAULT_API_BASE_URL = `http://localhost:${DEFAULT_API_PORT}${DEFAULT_API_PATH}`;

/**
 * 認証が必要なAPI操作で未認証時にスローされるエラーコード
 */
export const AUTH_REQUIRED = 'auth_required' as const;

/**
 * セッションが見つからない場合にスローされるエラーコード
 */
export const SESSION_NOT_FOUND = 'session_not_found' as const;
