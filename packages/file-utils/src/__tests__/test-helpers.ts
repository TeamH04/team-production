import { mock } from 'node:test';

/**
 * fetch モック用のレスポンス型
 */
export interface MockFetchResponse {
  arrayBuffer?: ArrayBuffer;
  blob?: Blob;
  json?: unknown;
  text?: string;
}

/**
 * MockFetchResponse からモックレスポンスオブジェクトを生成する
 *
 * @param response - モックするレスポンスデータ
 * @returns Response 互換のモックオブジェクト
 */
function createMockResponse(response: MockFetchResponse) {
  return {
    arrayBuffer: async () => response.arrayBuffer ?? new ArrayBuffer(0),
    blob: async () => response.blob ?? new Blob([]),
    json: async () => response.json ?? {},
    text: async () => response.text ?? '',
  };
}

/**
 * fetch モックの共通パターンを抽象化したベースヘルパー
 *
 * @param mockImplementation - fetch のモック実装
 * @param additionalState - 追加の状態（getCalledUri など）
 * @returns cleanup 関数と追加の状態を含むオブジェクト
 */
function createMockFetchBase<T extends object>(
  mockImplementation: (...args: Parameters<typeof fetch>) => Promise<unknown>,
  additionalState?: T,
): { cleanup: () => void } & T {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mock.fn(mockImplementation) as unknown as typeof fetch;

  return {
    cleanup: () => {
      globalThis.fetch = originalFetch;
    },
    ...additionalState,
  } as { cleanup: () => void } & T;
}

/**
 * fetch をモックするヘルパー
 *
 * @param response - モックするレスポンスデータ
 * @returns fetch を元に戻すクリーンアップ関数
 *
 * @example
 * ```typescript
 * const cleanup = mockFetch({
 *   arrayBuffer: new Uint8Array([1, 2, 3]).buffer,
 * });
 *
 * // テスト実行
 * await fetchAssetAsBytes(asset);
 *
 * // クリーンアップ
 * cleanup();
 * ```
 */
export function mockFetch(response: MockFetchResponse): () => void {
  const { cleanup } = createMockFetchBase(async () => createMockResponse(response));
  return cleanup;
}

/**
 * URI をキャプチャしながら fetch をモックするヘルパー
 *
 * @param response - モックするレスポンスデータ
 * @returns オブジェクト containing cleanup function and getCalledUri function
 *
 * @example
 * ```typescript
 * const { cleanup, getCalledUri } = mockFetchWithCapture({
 *   arrayBuffer: new Uint8Array([1, 2, 3]).buffer,
 * });
 *
 * await fetchAssetAsBytes(asset);
 *
 * assert.strictEqual(getCalledUri(), 'https://example.com/test.png');
 * cleanup();
 * ```
 */
export function mockFetchWithCapture(response: MockFetchResponse): {
  cleanup: () => void;
  getCalledUri: () => string;
} {
  let calledUri = '';

  return createMockFetchBase(
    async (uri: string | URL | Request) => {
      calledUri = uri.toString();
      return createMockResponse(response);
    },
    { getCalledUri: () => calledUri },
  );
}

/**
 * fetch がエラーをスローするようにモックする
 *
 * @param error - スローするエラー
 * @returns fetch を元に戻すクリーンアップ関数
 *
 * @example
 * ```typescript
 * const cleanup = mockFetchError(new Error('Network error'));
 *
 * await assert.rejects(() => fetchAssetAsBytes(asset), /Network error/);
 *
 * cleanup();
 * ```
 */
export function mockFetchError(error: Error): () => void {
  const { cleanup } = createMockFetchBase(async () => {
    throw error;
  });
  return cleanup;
}

/**
 * response.arrayBuffer が undefined の場合をシミュレートするモック
 * Blob 経由のパスをテストするために使用
 *
 * @param blobData - Blob に含めるデータ
 * @returns fetch を元に戻すクリーンアップ関数
 *
 * @example
 * ```typescript
 * const cleanup = mockFetchWithoutArrayBuffer(new Uint8Array([1, 2, 3]));
 *
 * const result = await fetchAssetAsBytes(asset);
 *
 * cleanup();
 * ```
 */
export function mockFetchWithoutArrayBuffer(blobData: Uint8Array<ArrayBuffer>): () => void {
  const { cleanup } = createMockFetchBase(async () => ({
    arrayBuffer: undefined,
    blob: async () => new Blob([blobData]),
  }));
  return cleanup;
}
