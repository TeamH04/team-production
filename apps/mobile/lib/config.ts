/* global __DEV__ */
declare const __DEV__: boolean;

/**
 * 環境変数設定を集約するモジュール
 * 各モジュールはここから環境変数を取得する
 */
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { createEnvConfig } from '@team/constants';
export type { EnvConfig, EnvKey } from '@team/constants';

const DEFAULT_API_PORT = '8080';
const DEFAULT_API_PATH = '/api';

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

  // シミュレータ/エミュレータかどうかを判定
  // Device.isDevice: 実機の場合true、シミュレータ/エミュレータの場合false
  const isSimulator = !Device.isDevice;

  // ホストURIからホスト部分（IPv4, ホスト名, IPv6）を抽出
  const hostIp = hostUri?.match(/^\[[^\]]+\]|^[^:]+/)?.[0];

  // プラットフォームとデバイスタイプに応じて適切なホストを選択
  let apiHost: string;

  if (Platform.OS === 'android') {
    if (isSimulator) {
      // Androidエミュレータ: 10.0.2.2はホストマシンのlocalhost
      apiHost = '10.0.2.2';
    } else {
      // Android実機: ホストIPが必要
      if (!hostIp) {
        return undefined;
      }
      apiHost = hostIp;
    }
  } else if (Platform.OS === 'ios') {
    if (isSimulator) {
      // iOSシミュレータ: Mac上で動作するのでlocalhost
      apiHost = 'localhost';
    } else {
      // iOS実機: ホストIPが必要
      if (!hostIp) {
        return undefined;
      }
      apiHost = hostIp;
    }
  } else {
    // Web等その他のプラットフォーム
    apiHost = 'localhost';
  }

  const apiPort = process.env.EXPO_PUBLIC_API_PORT ?? DEFAULT_API_PORT;
  const apiPath = process.env.EXPO_PUBLIC_API_PATH ?? DEFAULT_API_PATH;
  const normalizedPath = apiPath.startsWith('/') ? apiPath : `/${apiPath}`;
  const url = `http://${apiHost}:${apiPort}${normalizedPath}`;

  return url;
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

  // 本番ビルドでは環境変数が必須
  if (!__DEV__) {
    throw new Error(
      'EXPO_PUBLIC_API_BASE_URL must be set and non-empty in production builds.',
    );
  }

  // 開発環境では自動判定
  const devUrl = getDevApiBaseUrl();
  if (devUrl) {
    return devUrl;
  }

  console.warn(
    'Failed to auto-detect API base URL. Please set EXPO_PUBLIC_API_BASE_URL manually.',
  );

  // 開発環境での最終フォールバック
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
