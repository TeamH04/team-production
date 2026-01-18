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
  const originalFetch = globalThis.fetch;

  globalThis.fetch = mock.fn(async () => createMockResponse(response)) as unknown as typeof fetch;

  return () => {
    globalThis.fetch = originalFetch;
  };
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
  const originalFetch = globalThis.fetch;
  let calledUri = '';

  globalThis.fetch = mock.fn(async (uri: string | URL | Request) => {
    calledUri = uri.toString();
    return createMockResponse(response);
  }) as unknown as typeof fetch;

  return {
    cleanup: () => {
      globalThis.fetch = originalFetch;
    },
    getCalledUri: () => calledUri,
  };
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
  const originalFetch = globalThis.fetch;

  globalThis.fetch = mock.fn(async () => {
    throw error;
  }) as unknown as typeof fetch;

  return () => {
    globalThis.fetch = originalFetch;
  };
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
export function mockFetchWithoutArrayBuffer(blobData: Uint8Array): () => void {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = mock.fn(async () => ({
    arrayBuffer: undefined,
    blob: async () => new Blob([blobData as BlobPart]),
  })) as unknown as typeof fetch;

  return () => {
    globalThis.fetch = originalFetch;
  };
}
