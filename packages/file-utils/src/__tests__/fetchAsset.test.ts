import assert from 'node:assert';
import { afterEach, beforeEach, describe, test } from 'node:test';

import { fetchAssetAsBytes, type AssetInfo } from '../fetchAsset';

import {
  mockFetch,
  mockFetchError,
  mockFetchWithCapture,
  mockFetchWithoutArrayBuffer,
} from './test-helpers';

describe('fetchAssetAsBytes', () => {
  let cleanup: (() => void) | undefined;

  beforeEach(() => {
    cleanup = undefined;
  });

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  test('fetchレスポンスからUint8Arrayを返す', async () => {
    const testData = new Uint8Array([1, 2, 3, 4, 5]);

    cleanup = mockFetch({
      arrayBuffer: testData.buffer,
      blob: new Blob([testData]),
    });

    const asset: AssetInfo = {
      uri: 'file:///test/image.jpg',
      contentType: 'image/jpeg',
    };

    const result = await fetchAssetAsBytes(asset);

    assert.ok(result instanceof Uint8Array, 'Result should be Uint8Array');
    assert.deepStrictEqual(Array.from(result), [1, 2, 3, 4, 5]);
  });

  test('正しいURIでfetchを呼び出す', async () => {
    const testData = new Uint8Array([10, 20, 30]);

    const { cleanup: cleanupFn, getCalledUri } = mockFetchWithCapture({
      arrayBuffer: testData.buffer,
      blob: new Blob([testData]),
    });
    cleanup = cleanupFn;

    const asset: AssetInfo = {
      uri: 'https://example.com/test.png',
      contentType: 'image/png',
    };

    await fetchAssetAsBytes(asset);

    assert.strictEqual(getCalledUri(), 'https://example.com/test.png');
  });

  test('空ファイルを正しく処理する', async () => {
    const testData = new Uint8Array([]);

    cleanup = mockFetch({
      arrayBuffer: testData.buffer,
      blob: new Blob([]),
    });

    const asset: AssetInfo = {
      uri: 'file:///empty.txt',
      contentType: 'text/plain',
    };

    const result = await fetchAssetAsBytes(asset);

    assert.ok(result instanceof Uint8Array, 'Result should be Uint8Array');
    assert.strictEqual(result.length, 0);
  });

  test('fetchがエラーをスローした場合、例外が伝播する', async () => {
    cleanup = mockFetchError(new Error('Network error'));

    const asset: AssetInfo = {
      uri: 'https://example.com/unreachable.png',
      contentType: 'image/png',
    };

    await assert.rejects(() => fetchAssetAsBytes(asset), /Network error/);
  });

  test('arrayBufferがundefinedの場合、Blob経由でデータを取得する', async () => {
    const testData = new Uint8Array([100, 200, 150]);

    cleanup = mockFetchWithoutArrayBuffer(testData);

    const asset: AssetInfo = {
      uri: 'file:///test/blob-path.jpg',
      contentType: 'image/jpeg',
    };

    const result = await fetchAssetAsBytes(asset);

    assert.ok(result instanceof Uint8Array, 'Result should be Uint8Array');
    assert.deepStrictEqual(Array.from(result), [100, 200, 150]);
  });
});
