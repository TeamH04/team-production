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

import { IS_DEV } from '@team/constants';

/**
 * 開発環境でのみ console.log を出力
 */
export function devLog(...args: unknown[]): void {
  if (IS_DEV) {
    console.log(...args);
  }
}

/**
 * 開発環境でのみ console.warn を出力
 */
export function devWarn(...args: unknown[]): void {
  if (IS_DEV) {
    console.warn(...args);
  }
}

/**
 * 開発環境でのみ console.error を出力
 */
export function devError(...args: unknown[]): void {
  if (IS_DEV) {
    console.error(...args);
  }
}
