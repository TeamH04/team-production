/**
 * 環境変数設定を集約するモジュール
 * 各モジュールはここから環境変数を取得する
 */
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { createEnvConfig } from '@team/constants';
export type { EnvConfig, EnvKey } from '@team/constants';

/**
 * 開発環境でのAPIベースURLを自動判定する
 *
 * - iOSシミュレータ: localhost
 * - Androidエミュレータ: 10.0.2.2 (ホストのlocalhost)
 * - 実機: Expo開発サーバーのホストIP
 *
 * @returns 開発環境用のAPIベースURL、判定不可の場合はundefined
 */
function getDevApiBaseUrl(): string | undefined {
  // Expo開発サーバーのホスト情報を取得 (例: "192.168.11.6:8081")
  const hostUri = Constants.expoConfig?.hostUri;

  if (!hostUri) {
    return undefined;
  }

  // ホストURIからIPアドレス部分を抽出
  const hostIp = hostUri.split(':')[0];

  // プラットフォームに応じて適切なホストを選択
  let apiHost: string;

  if (Platform.OS === 'android') {
    // Androidエミュレータの場合は10.0.2.2、実機の場合はホストIP
    // hostIpがlocalhostや127.0.0.1の場合はエミュレータと判定
    if (hostIp === 'localhost' || hostIp === '127.0.0.1') {
      apiHost = '10.0.2.2';
    } else {
      apiHost = hostIp;
    }
  } else if (Platform.OS === 'ios') {
    // iOSシミュレータはlocalhostでOK、実機はホストIP
    if (hostIp === 'localhost' || hostIp === '127.0.0.1') {
      apiHost = 'localhost';
    } else {
      apiHost = hostIp;
    }
  } else {
    // Web等その他のプラットフォーム
    apiHost = 'localhost';
  }

  return `http://${apiHost}:8080/api`;
}

/**
 * APIベースURLを取得する
 * 環境変数が設定されていればそれを使用、なければ自動判定
 */
function getApiBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

  // 環境変数が明示的に設定されている場合はそれを使用
  if (envUrl && envUrl.trim() !== '') {
    return envUrl;
  }

  // 開発環境では自動判定
  if (__DEV__) {
    const devUrl = getDevApiBaseUrl();
    if (devUrl) {
      return devUrl;
    }
  }

  // フォールバック
  return '';
}

/**
 * Expo 環境変数から ENV オブジェクトを作成
 */
export const ENV = createEnvConfig({
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  SUPABASE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '',
  SUPABASE_STORAGE_BUCKET: process.env.EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET,
  API_BASE_URL: getApiBaseUrl(),
  WEB_BASE_URL: process.env.EXPO_PUBLIC_WEB_BASE_URL ?? '',
});
