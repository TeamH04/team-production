/**
 * 環境変数設定を集約するモジュール
 * 各モジュールはここから環境変数を取得する
 */
import { createEnvConfig } from '@team/constants';
export type { EnvConfig, EnvKey } from '@team/constants';

/**
 * Next.js 環境変数から ENV オブジェクトを作成
 */
export const ENV = createEnvConfig({
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '',
  SUPABASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET,
  API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL ?? '',
  WEB_BASE_URL: process.env.NEXT_PUBLIC_WEB_BASE_URL ?? '',
});
