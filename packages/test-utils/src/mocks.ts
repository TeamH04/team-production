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
