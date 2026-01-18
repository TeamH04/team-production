/**
 * 非同期テスト用ユーティリティ
 */

/**
 * 全ての保留中のPromiseを解決するまで待機する
 * setTimeoutによる不安定な待機の代替として使用
 */
export const flushPromises = (): Promise<void> =>
  new Promise(resolve => {
    // setImmediateはマイクロタスクキューを処理してから実行される
    if (typeof setImmediate !== 'undefined') {
      setImmediate(resolve);
    } else {
      setTimeout(resolve, 0);
    }
  });

/**
 * 条件が真になるまで待機する（ポーリングベース）
 *
 * @param condition - 待機条件を返す関数。trueを返すと待機終了
 * @param options - 待機オプション
 * @param options.timeout - タイムアウト時間（ミリ秒）。デフォルト: 1000ms
 * @param options.interval - ポーリング間隔（ミリ秒）。デフォルト: 10ms
 * @throws {Error} タイムアウト時に "waitFor: timeout after {timeout}ms" エラーをスロー
 *
 * @example
 * ```ts
 * // 要素が表示されるまで待機
 * await waitFor(() => element.isVisible);
 *
 * // カスタムタイムアウトで待機
 * await waitFor(() => fetchCompleted, { timeout: 5000 });
 * ```
 */
export const waitFor = async (
  condition: () => boolean | Promise<boolean>,
  options: { timeout?: number; interval?: number } = {},
): Promise<void> => {
  const { timeout = 1000, interval = 10 } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error(`waitFor: timeout after ${timeout}ms`);
};
