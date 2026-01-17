/**
 * React Context テスト用の汎用Harnessファクトリ
 */
import { act, useEffect } from 'react';
import TestRenderer from 'react-test-renderer';

import type { ComponentType, ReactElement, ReactNode } from 'react';
import type { ReactTestRenderer } from 'react-test-renderer';

import './setup';

type RendererHandle = Pick<ReactTestRenderer, 'unmount'>;

const createRenderer = TestRenderer.create.bind(TestRenderer) as (
  element: ReactElement,
) => RendererHandle;

export type ContextHarness<T> = {
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

export { createRenderer, act };
