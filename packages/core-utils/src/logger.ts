/**
 * 開発環境専用のログユーティリティ
 *
 * __DEV__ フラグをチェックし、開発環境でのみログを出力します。
 * 本番ビルドではログ出力がスキップされるため、パフォーマンスへの影響がありません。
 *
 * @example
 * ```typescript
 * import { devLog, devWarn, devError } from '@team/core-utils';
 *
 * devLog('Debug info:', data);
 * devWarn('Warning:', message);
 * devError('Error occurred:', error);
 * ```
 */

// React Native / Expo の __DEV__ グローバル変数
// Node.js 環境では process.env.NODE_ENV を使用
declare const __DEV__: boolean | undefined;

const isDev = (): boolean => {
  if (typeof __DEV__ !== 'undefined') {
    return __DEV__;
  }
  if (typeof process !== 'undefined' && process.env?.NODE_ENV) {
    return process.env.NODE_ENV !== 'production';
  }
  return false;
};

/**
 * 開発環境でのみ console.log を出力
 */
export function devLog(...args: unknown[]): void {
  if (isDev()) {
    console.log(...args);
  }
}

/**
 * 開発環境でのみ console.warn を出力
 */
export function devWarn(...args: unknown[]): void {
  if (isDev()) {
    console.warn(...args);
  }
}

/**
 * 開発環境でのみ console.error を出力
 */
export function devError(...args: unknown[]): void {
  if (isDev()) {
    console.error(...args);
  }
}
