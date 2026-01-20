import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, mock, test } from 'node:test';

import { act, useEffect, useRef } from 'react';
import TestRenderer from 'react-test-renderer';

import {
  useSearchHistoryStorage,
  type StorageAdapter,
  type UseSearchHistoryStorageOptions,
} from '../useSearchHistoryStorage';

import type { ReactElement, ReactNode } from 'react';
import type { ReactTestRenderer } from 'react-test-renderer';

// =============================================================================
// Test Setup Utilities
// =============================================================================

// React act環境を有効化
const globalForReactAct = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};
globalForReactAct.IS_REACT_ACT_ENVIRONMENT = true;

/**
 * 全ての保留中のPromiseを解決するまで待機する
 */
const flushPromises = (): Promise<void> =>
  new Promise(resolve => {
    if (typeof setImmediate !== 'undefined') {
      setImmediate(resolve);
    } else {
      setTimeout(resolve, 0);
    }
  });

// =============================================================================
// Test Harness
// =============================================================================

type HookHarness<T> = {
  getValue: () => T;
  unmount: () => void;
};

/**
 * フックテスト用の汎用Harnessを作成
 * Provider不要のフック向け
 */
const createHookHarness = <T,>(
  useHook: () => T,
  wrapper?: (props: { children: ReactNode }) => ReactElement,
): HookHarness<T> => {
  let currentValue: T | undefined;
  let renderer: ReactTestRenderer | undefined;

  const handleValue = (value: T) => {
    currentValue = value;
  };

  const Consumer = ({ onValue }: { onValue: (value: T) => void }) => {
    const value = useHook();
    const mountedRef = useRef(true);

    useEffect(() => {
      return () => {
        mountedRef.current = false;
      };
    }, []);

    useEffect(() => {
      if (mountedRef.current) {
        onValue(value);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    return null;
  };

  const element = wrapper ? (
    wrapper({ children: <Consumer onValue={handleValue} /> })
  ) : (
    <Consumer onValue={handleValue} />
  );

  act(() => {
    renderer = TestRenderer.create(element);
  });

  if (!renderer) {
    throw new Error('Renderer setup failed');
  }

  return {
    getValue: () => {
      if (currentValue === undefined) {
        throw new Error('Hook value not available');
      }
      return currentValue;
    },
    unmount: () => {
      act(() => {
        renderer!.unmount();
      });
    },
  };
};

// =============================================================================
// Mock Storage Factory
// =============================================================================

type MockStorage = StorageAdapter & {
  _data: Map<string, string>;
  _getItemError: Error | null;
  _setItemError: Error | null;
  getItem: ReturnType<typeof mock.fn<(key: string) => Promise<string | null>>>;
  setItem: ReturnType<typeof mock.fn<(key: string, value: string) => Promise<void>>>;
};

const createMockStorage = (initialData: Record<string, string> = {}): MockStorage => {
  const data = new Map(Object.entries(initialData));
  let getItemError: Error | null = null;
  let setItemError: Error | null = null;

  const getItem = mock.fn(async (key: string): Promise<string | null> => {
    if (getItemError) throw getItemError;
    return data.get(key) ?? null;
  });

  const setItem = mock.fn(async (key: string, value: string): Promise<void> => {
    if (setItemError) throw setItemError;
    data.set(key, value);
  });

  return {
    _data: data,
    get _getItemError() {
      return getItemError;
    },
    set _getItemError(error: Error | null) {
      getItemError = error;
    },
    get _setItemError() {
      return setItemError;
    },
    set _setItemError(error: Error | null) {
      setItemError = error;
    },
    getItem,
    setItem,
  };
};

// =============================================================================
// Test Utilities
// =============================================================================

const DEFAULT_STORAGE_KEY = '@team/search_history';

const createHarness = (
  storage: StorageAdapter,
  options: Partial<Omit<UseSearchHistoryStorageOptions, 'storage'>> = {},
) => {
  return createHookHarness(() =>
    useSearchHistoryStorage({
      storage,
      ...options,
    }),
  );
};

// =============================================================================
// Tests
// =============================================================================

describe('useSearchHistoryStorage', () => {
  let mockStorage: MockStorage;

  beforeEach(() => {
    mockStorage = createMockStorage();
  });

  afterEach(() => {
    mock.restoreAll();
  });

  describe('基本機能', () => {
    test('初期状態で空の履歴を返す', async () => {
      const { getValue, unmount } = createHarness(mockStorage);

      await act(async () => {
        await flushPromises();
      });

      assert.deepEqual(getValue().searchHistory, []);

      unmount();
    });

    test('isLoading が最初は true で、ロード完了後に false になる', async () => {
      // 遅延ストレージを作成
      let resolveGetItem: (value: string | null) => void;
      const delayedStorage = createMockStorage();
      delayedStorage.getItem = mock.fn(
        async (): Promise<string | null> =>
          new Promise(resolve => {
            resolveGetItem = resolve;
          }),
      );

      const { getValue, unmount } = createHarness(delayedStorage);

      // 初期状態では isLoading は true
      assert.equal(getValue().isLoading, true);

      // ストレージからの読み込みを完了
      await act(async () => {
        resolveGetItem!(null);
        await flushPromises();
      });

      // ロード完了後は isLoading が false
      assert.equal(getValue().isLoading, false);

      unmount();
    });
  });

  describe('addToHistory', () => {
    test('履歴に追加できる', async () => {
      const { getValue, unmount } = createHarness(mockStorage);

      await act(async () => {
        await flushPromises();
      });

      await act(async () => {
        getValue().addToHistory('テスト検索');
        await flushPromises();
      });

      assert.deepEqual(getValue().searchHistory, ['テスト検索']);

      unmount();
    });

    test('空文字列は追加されない', async () => {
      const { getValue, unmount } = createHarness(mockStorage);

      await act(async () => {
        await flushPromises();
      });

      await act(async () => {
        getValue().addToHistory('');
        await flushPromises();
      });

      assert.deepEqual(getValue().searchHistory, []);

      unmount();
    });

    test('空白のみの文字列は追加されない', async () => {
      const { getValue, unmount } = createHarness(mockStorage);

      await act(async () => {
        await flushPromises();
      });

      await act(async () => {
        getValue().addToHistory('   ');
        await flushPromises();
      });

      assert.deepEqual(getValue().searchHistory, []);

      unmount();
    });

    test('重複する項目は先頭に移動される', async () => {
      const { getValue, unmount } = createHarness(mockStorage);

      await act(async () => {
        await flushPromises();
      });

      await act(async () => {
        getValue().addToHistory('検索1');
        await flushPromises();
      });

      await act(async () => {
        getValue().addToHistory('検索2');
        await flushPromises();
      });

      await act(async () => {
        getValue().addToHistory('検索1');
        await flushPromises();
      });

      // 検索1が先頭に移動される
      assert.deepEqual(getValue().searchHistory, ['検索1', '検索2']);

      unmount();
    });

    test('maxItems を超えると古い項目が削除される', async () => {
      const { getValue, unmount } = createHarness(mockStorage, { maxItems: 3 });

      await act(async () => {
        await flushPromises();
      });

      await act(async () => {
        getValue().addToHistory('検索1');
        await flushPromises();
      });

      await act(async () => {
        getValue().addToHistory('検索2');
        await flushPromises();
      });

      await act(async () => {
        getValue().addToHistory('検索3');
        await flushPromises();
      });

      await act(async () => {
        getValue().addToHistory('検索4');
        await flushPromises();
      });

      // 最も古い「検索1」が削除される
      assert.deepEqual(getValue().searchHistory, ['検索4', '検索3', '検索2']);

      unmount();
    });
  });

  describe('removeFromHistory', () => {
    test('履歴から削除できる', async () => {
      const { getValue, unmount } = createHarness(mockStorage);

      await act(async () => {
        await flushPromises();
      });

      await act(async () => {
        getValue().addToHistory('検索1');
        getValue().addToHistory('検索2');
        await flushPromises();
      });

      await act(async () => {
        getValue().removeFromHistory('検索1');
        await flushPromises();
      });

      assert.deepEqual(getValue().searchHistory, ['検索2']);

      unmount();
    });

    test('存在しない項目を削除しても履歴が変更されない', async () => {
      const { getValue, unmount } = createHarness(mockStorage);

      await act(async () => {
        await flushPromises();
      });

      await act(async () => {
        getValue().addToHistory('検索1');
        await flushPromises();
      });

      await act(async () => {
        getValue().removeFromHistory('存在しない');
        await flushPromises();
      });

      assert.deepEqual(getValue().searchHistory, ['検索1']);

      unmount();
    });
  });

  describe('clearHistory', () => {
    test('履歴をクリアできる', async () => {
      const { getValue, unmount } = createHarness(mockStorage);

      await act(async () => {
        await flushPromises();
      });

      await act(async () => {
        getValue().addToHistory('検索1');
        getValue().addToHistory('検索2');
        await flushPromises();
      });

      await act(async () => {
        getValue().clearHistory();
        await flushPromises();
      });

      assert.deepEqual(getValue().searchHistory, []);

      unmount();
    });
  });

  describe('ストレージ連携', () => {
    test('ストレージから履歴を読み込む', async () => {
      const storageWithData = createMockStorage({
        [DEFAULT_STORAGE_KEY]: JSON.stringify(['保存済み1', '保存済み2']),
      });

      const { getValue, unmount } = createHarness(storageWithData);

      await act(async () => {
        await flushPromises();
      });

      assert.deepEqual(getValue().searchHistory, ['保存済み1', '保存済み2']);
      assert.equal(storageWithData.getItem.mock.calls.length, 1);

      unmount();
    });

    test('履歴変更時にストレージに保存される', async () => {
      const { getValue, unmount } = createHarness(mockStorage);

      await act(async () => {
        await flushPromises();
      });

      await act(async () => {
        getValue().addToHistory('新しい検索');
        await flushPromises();
      });

      // setItem が呼ばれたことを確認
      assert.ok(mockStorage.setItem.mock.calls.length > 0);

      // 保存されたデータを確認
      const savedData = mockStorage._data.get(DEFAULT_STORAGE_KEY);
      assert.ok(savedData);
      assert.deepEqual(JSON.parse(savedData), ['新しい検索']);

      unmount();
    });

    test('カスタムストレージキーで保存・読み込みできる', async () => {
      const customKey = 'custom_history_key';
      const storageWithData = createMockStorage({
        [customKey]: JSON.stringify(['カスタム履歴']),
      });

      const { getValue, unmount } = createHarness(storageWithData, {
        storageKey: customKey,
      });

      await act(async () => {
        await flushPromises();
      });

      assert.deepEqual(getValue().searchHistory, ['カスタム履歴']);

      unmount();
    });
  });

  describe('エラーハンドリング', () => {
    test('storage.getItem が失敗しても正常に動作する', async () => {
      const errorStorage = createMockStorage();
      errorStorage._getItemError = new Error('Storage read error');

      const { getValue, unmount } = createHarness(errorStorage);

      await act(async () => {
        await flushPromises();
      });

      // エラーが発生しても空の履歴で初期化される
      assert.deepEqual(getValue().searchHistory, []);
      assert.equal(getValue().isLoading, false);

      // 機能は正常に動作する
      await act(async () => {
        // setItem はエラーを発生しないので追加できる
        errorStorage._getItemError = null;
        getValue().addToHistory('エラー後の検索');
        await flushPromises();
      });

      assert.deepEqual(getValue().searchHistory, ['エラー後の検索']);

      unmount();
    });

    test('storage.setItem が失敗しても正常に動作する', async () => {
      const errorStorage = createMockStorage();

      const { getValue, unmount } = createHarness(errorStorage);

      await act(async () => {
        await flushPromises();
      });

      // setItem でエラーを発生させる
      errorStorage._setItemError = new Error('Storage write error');

      await act(async () => {
        getValue().addToHistory('保存失敗検索');
        await flushPromises();
      });

      // メモリ上の状態は更新される（保存は失敗するが）
      assert.deepEqual(getValue().searchHistory, ['保存失敗検索']);

      unmount();
    });

    test('不正な JSON がストレージにあっても正常に動作する', async () => {
      const invalidJsonStorage = createMockStorage({
        [DEFAULT_STORAGE_KEY]: 'invalid json {{{',
      });

      const { getValue, unmount } = createHarness(invalidJsonStorage);

      await act(async () => {
        await flushPromises();
      });

      // 不正なJSONは無視され、空の履歴で初期化される
      assert.deepEqual(getValue().searchHistory, []);
      assert.equal(getValue().isLoading, false);

      unmount();
    });

    test('配列でないデータがストレージにあっても正常に動作する', async () => {
      const nonArrayStorage = createMockStorage({
        [DEFAULT_STORAGE_KEY]: JSON.stringify({ key: 'value' }),
      });

      const { getValue, unmount } = createHarness(nonArrayStorage);

      await act(async () => {
        await flushPromises();
      });

      // 配列でないデータは無視され、空の履歴で初期化される
      assert.deepEqual(getValue().searchHistory, []);
      assert.equal(getValue().isLoading, false);

      unmount();
    });

    test('文字列以外の要素を含む配列がストレージにあっても正常に動作する', async () => {
      const mixedArrayStorage = createMockStorage({
        [DEFAULT_STORAGE_KEY]: JSON.stringify(['valid', 123, 'also valid', null]),
      });

      const { getValue, unmount } = createHarness(mixedArrayStorage);

      await act(async () => {
        await flushPromises();
      });

      // 文字列以外の要素を含む配列は無効として扱われる
      assert.deepEqual(getValue().searchHistory, []);
      assert.equal(getValue().isLoading, false);

      unmount();
    });
  });

  describe('ロード中の競合', () => {
    test('ロード中に addToHistory が呼ばれた場合、両方の履歴がマージされる', async () => {
      // 遅延するストレージを作成
      let resolveGetItem: (value: string | null) => void;
      const delayedStorage: MockStorage = createMockStorage();
      delayedStorage.getItem = mock.fn(
        async (): Promise<string | null> =>
          new Promise(resolve => {
            resolveGetItem = resolve;
          }),
      );

      const { getValue, unmount } = createHarness(delayedStorage);

      // ロード中に addToHistory を呼ぶ
      await act(async () => {
        getValue().addToHistory('ロード中に追加');
        await flushPromises();
      });

      // ロード中に追加された履歴がある
      assert.deepEqual(getValue().searchHistory, ['ロード中に追加']);
      assert.equal(getValue().isLoading, true);

      // ストレージからの読み込みを完了（既存データあり）
      await act(async () => {
        resolveGetItem!(JSON.stringify(['既存1', '既存2']));
        await flushPromises();
      });

      // ロード中に追加した履歴が先頭に来て、ストレージの履歴がマージされる
      assert.deepEqual(getValue().searchHistory, ['ロード中に追加', '既存1', '既存2']);
      assert.equal(getValue().isLoading, false);

      unmount();
    });

    test('ロード中に追加した履歴がストレージの履歴と重複する場合は重複除去される', async () => {
      let resolveGetItem: (value: string | null) => void;
      const delayedStorage: MockStorage = createMockStorage();
      delayedStorage.getItem = mock.fn(
        async (): Promise<string | null> =>
          new Promise(resolve => {
            resolveGetItem = resolve;
          }),
      );

      const { getValue, unmount } = createHarness(delayedStorage);

      // ロード中に addToHistory を呼ぶ
      await act(async () => {
        getValue().addToHistory('重複する検索');
        await flushPromises();
      });

      // ストレージからの読み込みを完了（重複する項目を含む）
      await act(async () => {
        resolveGetItem!(JSON.stringify(['重複する検索', '既存のみ']));
        await flushPromises();
      });

      // 重複が除去され、ロード中に追加した履歴が先頭に来る
      assert.deepEqual(getValue().searchHistory, ['重複する検索', '既存のみ']);

      unmount();
    });
  });

  describe('エッジケース', () => {
    test('前後に空白がある文字列はトリムされて追加される', async () => {
      const { getValue, unmount } = createHarness(mockStorage);

      await act(async () => {
        await flushPromises();
      });

      await act(async () => {
        getValue().addToHistory('  検索語  ');
        await flushPromises();
      });

      assert.deepEqual(getValue().searchHistory, ['検索語']);

      unmount();
    });

    test('トリム後に同じ文字列になる場合は重複として扱われる', async () => {
      const { getValue, unmount } = createHarness(mockStorage);

      await act(async () => {
        await flushPromises();
      });

      await act(async () => {
        getValue().addToHistory('検索語');
        await flushPromises();
      });

      await act(async () => {
        getValue().addToHistory('  検索語  ');
        await flushPromises();
      });

      // 重複として扱われ、1つだけ残る
      assert.deepEqual(getValue().searchHistory, ['検索語']);

      unmount();
    });

    test('maxItems が 0 の場合は履歴が保存されない', async () => {
      const { getValue, unmount } = createHarness(mockStorage, { maxItems: 0 });

      await act(async () => {
        await flushPromises();
      });

      await act(async () => {
        getValue().addToHistory('検索');
        await flushPromises();
      });

      assert.deepEqual(getValue().searchHistory, []);

      unmount();
    });
  });
});
