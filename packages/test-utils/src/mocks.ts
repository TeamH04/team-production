/**
 * 共通テストモック（フレームワーク非依存）
 */

type MockFn = <T extends (...args: never[]) => unknown>(fn: T) => T;

interface CreateLocalStorageMockOptions {
  /**
   * 各メソッドをラップするモック関数（vi.fn, jest.fn など）
   * 指定すると、呼び出し回数や引数の検証が可能になる
   */
  mockFn?: MockFn;
}

/**
 * localStorage のモックを作成
 *
 * @example
 * // 基本的な使い方（スパイ機能なし）
 * const { mock } = createLocalStorageMock();
 *
 * @example
 * // Vitest でスパイ機能を使う場合
 * const { mock } = createLocalStorageMock({ mockFn: vi.fn });
 * expect(mock.setItem).toHaveBeenCalledWith('key', 'value');
 */
export const createLocalStorageMock = (options?: CreateLocalStorageMockOptions) => {
  let storage: Record<string, string> = {};
  const wrap: MockFn = options?.mockFn ?? (fn => fn);

  const mock = {
    getItem: wrap((key: string) => storage[key] ?? null),
    setItem: wrap((key: string, value: string) => {
      storage[key] = value;
    }),
    removeItem: wrap((key: string) => {
      delete storage[key];
    }),
    clear: wrap(() => {
      storage = {};
    }),
    get length() {
      return Object.keys(storage).length;
    },
    key: wrap((i: number) => Object.keys(storage)[i] ?? null),
  };

  return {
    storage,
    mock,
    reset: () => {
      storage = {};
    },
    setData: (data: Record<string, string>) => {
      storage = { ...data };
    },
  };
};

/**
 * テストランナー（Vitest/Jest）に応じたモック関数を提供するヘルパー
 * node:test の mock.fn 互換のインターフェースを提供し、
 * ブラウザ環境バンドル時に node:test をインポートしないようにする
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mock = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: <T extends (...args: any[]) => any>(implementation?: T) => {
    // Vitest
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof globalThis !== 'undefined' && (globalThis as any).vi) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (globalThis as any).vi.fn(implementation);
    }
    // Jest
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof globalThis !== 'undefined' && (globalThis as any).jest) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (globalThis as any).jest.fn(implementation);
    }

    // Fallback implementation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const calls: any[][] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockFn = (...args: any[]) => {
      calls.push(args);
      return implementation?.(...args);
    };
    mockFn.mock = { calls };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return mockFn as any;
  },
  restoreAll: () => {
    // Vitest
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof globalThis !== 'undefined' && (globalThis as any).vi) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).vi.restoreAllMocks();
    }
    // Jest
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    else if (typeof globalThis !== 'undefined' && (globalThis as any).jest) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).jest.restoreAllMocks();
    }
  },
};