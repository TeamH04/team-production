import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { fetchStoreById, fetchStores } from '../api';

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.unstubAllGlobals();
  mockFetch.mockReset();
});

describe('fetchStores', () => {
  test('店舗リストを正常に取得する', async () => {
    const mockStores = [
      { store_id: '1', name: 'Store 1' },
      { store_id: '2', name: 'Store 2' },
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockStores,
    });

    const stores = await fetchStores();

    expect(stores).toEqual(mockStores);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/stores'),
      expect.objectContaining({ cache: 'no-store' }),
    );
  });

  test('nullレスポンスで空配列を返す', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => null,
    });

    const stores = await fetchStores();
    expect(stores).toEqual([]);
  });

  test('APIエラー時にErrorをスローする', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    await expect(fetchStores()).rejects.toThrow('Request failed (500)');
  });
});

describe('fetchStoreById', () => {
  test('指定IDの店舗を正常に取得する', async () => {
    const mockStore = { store_id: 'test-1', name: 'Test Store' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockStore,
    });

    const store = await fetchStoreById('test-1');

    expect(store).toEqual(mockStore);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/stores/test-1'),
      expect.any(Object),
    );
  });

  test('IDをURLエンコードして送信する', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ store_id: 'test 1', name: 'Test Store' }),
    });

    await fetchStoreById('test 1');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/stores/test%201'),
      expect.any(Object),
    );
  });

  test('存在しないIDで404エラーをスローする', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    await expect(fetchStoreById('not-found')).rejects.toThrow('Request failed (404)');
  });

  test('サーバーエラー時に500エラーをスローする', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    await expect(fetchStoreById('any')).rejects.toThrow('Request failed (500)');
  });

  test('ネットワークエラー時にエラーをスローする', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(fetchStoreById('any')).rejects.toThrow('Network error');
  });
});
