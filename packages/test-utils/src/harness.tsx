/**
 * React Context テスト用の汎用Harnessファクトリ
 */
import React, { act, useEffect } from 'react';
import TestRenderer from 'react-test-renderer';

import { setupReactActEnvironment } from './setup';

import type { ComponentType, ReactElement, ReactNode } from 'react';
import type { ReactTestRenderer } from 'react-test-renderer';

// React act環境を有効化
setupReactActEnvironment();

type RendererHandle = Pick<ReactTestRenderer, 'unmount'>;

const createRenderer = TestRenderer.create.bind(TestRenderer) as (
  element: ReactElement,
) => RendererHandle;

export type ContextHarness<T> = {
  getValue: () => T;
  unmount: () => void;
};

export type HookHarness<T> = {
  getValue: () => T;
  unmount: () => void;
};

/**
 * Contextフック用の汎用テストHarnessを作成
 *
 * @example
 * const harness = createContextHarness(useUser, UserProvider);
 * expect(harness.getValue().user).toBe(null);
 * harness.unmount();
 */
export const createContextHarness = <T,>(
  useHook: () => T,
  Provider: ComponentType<{ children: ReactNode }>,
): ContextHarness<T> => {
  let currentValue: T | undefined;
  let renderer: RendererHandle | undefined;

  const handleValue = (value: T) => {
    currentValue = value;
  };

  const Consumer = ({ onValue }: { onValue: (value: T) => void }) => {
    const value = useHook();

    useEffect(() => {
      onValue(value);
      // eslint-disable-next-line react-hooks/exhaustive-deps -- onValue is stable (defined in closure)
    }, [value]);

    return null;
  };

  act(() => {
    renderer = createRenderer(
      <Provider>
        <Consumer onValue={handleValue} />
      </Provider>,
    );
  });

  if (!currentValue || !renderer) {
    throw new Error('Provider setup failed');
  }

  return {
    getValue: () => {
      if (!currentValue) {
        throw new Error('Provider setup failed');
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

/**
 * フックテスト用の汎用Harnessを作成
 * Provider不要のフック向け（オプショナルなwrapperで拡張可能）
 *
 * @example
 * // シンプルな使用例
 * const harness = createHookHarness(() => useMyHook());
 * expect(harness.getValue().someValue).toBe(expected);
 * harness.unmount();
 *
 * @example
 * // wrapperを使用した例
 * const harness = createHookHarness(
 *   () => useMyHook(),
 *   ({ children }) => <SomeProvider>{children}</SomeProvider>
 * );
 */
export const createHookHarness = <T,>(
  useHook: () => T,
  wrapper?: (props: { children: ReactNode }) => ReactElement,
): HookHarness<T> => {
  let currentValue: T | undefined;
  let renderer: RendererHandle | undefined;

  const handleValue = (value: T) => {
    currentValue = value;
  };

  const Consumer = ({ onValue }: { onValue: (value: T) => void }) => {
    const value = useHook();
    const mountedRef = React.useRef(true);

    useEffect(() => {
      return () => {
        mountedRef.current = false;
      };
    }, []);

    useEffect(() => {
      if (mountedRef.current) {
        onValue(value);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps -- onValue is stable (defined in closure)
    }, [value]);

    return null;
  };

  const element = wrapper ? (
    wrapper({ children: <Consumer onValue={handleValue} /> })
  ) : (
    <Consumer onValue={handleValue} />
  );

  act(() => {
    renderer = createRenderer(element);
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

export { createRenderer, act };
