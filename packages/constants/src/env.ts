/**
 * 環境変数の型定義
 * 実際の環境変数の読み取りは各プラットフォーム（mobile/web）で行う
 */

/**
 * 環境変数キーの定義
 * 各プラットフォームで異なるプレフィックスを使用するが、キー名は統一
 */
export const ENV_KEYS = {
  SUPABASE_URL: 'SUPABASE_URL',
  SUPABASE_PUBLISHABLE_KEY: 'SUPABASE_PUBLISHABLE_KEY',
  SUPABASE_STORAGE_BUCKET: 'SUPABASE_STORAGE_BUCKET',
  API_BASE_URL: 'API_BASE_URL',
  WEB_BASE_URL: 'WEB_BASE_URL',
} as const;

/**
 * 環境変数オブジェクトの型定義
 */
export interface EnvConfig {
  /** Supabase URL */
  SUPABASE_URL: string;
  /** Supabase Publishable Key */
  SUPABASE_PUBLISHABLE_KEY: string;
  /** Supabase Storage Bucket */
  SUPABASE_STORAGE_BUCKET: string | undefined;
  /** API Base URL */
  API_BASE_URL: string;
  /** Web Base URL */
  WEB_BASE_URL: string;
}

/**
 * 環境変数のキー型
 */
export type EnvKey = keyof EnvConfig;

/**
 * 環境変数オブジェクトを作成するファクトリー関数
 */
export function createEnvConfig(config: EnvConfig): Readonly<EnvConfig> {
  return Object.freeze(config);
}
