/**
 * テストユーティリティのエクスポート
 */
export { setupReactActEnvironment } from './setup';
export { act, createContextHarness, createRenderer, type ContextHarness } from './harness.js';
export {
  createMockApiReview,
  createMockApiStore,
  createMockShop,
  shopToApiStore,
} from './fixtures';

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
 * @param condition 待機条件
 * @param options タイムアウトとインターバルの設定
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
