import assert from 'node:assert/strict';
import { test } from 'node:test';
import React, { act, useEffect } from 'react';
import TestRenderer from 'react-test-renderer';

import { VisitedProvider, useVisited } from '../VisitedContext';

const globalForReactAct = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};
globalForReactAct.IS_REACT_ACT_ENVIRONMENT = true;

const createVisitedHarness = () => {
  let currentValue: ReturnType<typeof useVisited> | undefined;
  let renderer: ReturnType<typeof TestRenderer.create> | undefined;

  const handleValue = (value: ReturnType<typeof useVisited>) => {
    currentValue = value;
  };

  const Consumer = ({ onValue }: { onValue: (value: ReturnType<typeof useVisited>) => void }) => {
    const value = useVisited();

    useEffect(() => {
      onValue(value);
    }, [onValue, value]);

    return null;
  };

  act(() => {
    renderer = TestRenderer.create(
      <VisitedProvider>
        <Consumer onValue={handleValue} />
      </VisitedProvider>
    );
  });

  if (!currentValue || !renderer) {
    throw new Error('VisitedProvider setup failed');
  }

  return {
    getValue: () => {
      if (!currentValue) {
        throw new Error('VisitedProvider setup failed');
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

test('useVisited throws outside VisitedProvider', () => {
  const Consumer = () => {
    useVisited();
    return null;
  };

  assert.throws(() => {
    act(() => {
      TestRenderer.create(<Consumer />);
    });
  }, /useVisited must be used within VisitedProvider/);
});

test('addVisited marks a shop as visited', () => {
  const { getValue, unmount } = createVisitedHarness();

  act(() => {
    getValue().addVisited('shop-1');
  });

  assert.equal(getValue().isVisited('shop-1'), true);
  assert.equal(getValue().visited.has('shop-1'), true);

  unmount();
});

test('removeVisited removes a shop from visited', () => {
  const { getValue, unmount } = createVisitedHarness();

  act(() => {
    getValue().addVisited('shop-2');
  });

  act(() => {
    getValue().removeVisited('shop-2');
  });

  assert.equal(getValue().isVisited('shop-2'), false);
  assert.equal(getValue().visited.has('shop-2'), false);

  unmount();
});

test('toggleVisited adds and removes a shop', () => {
  const { getValue, unmount } = createVisitedHarness();

  act(() => {
    getValue().toggleVisited('shop-3');
  });

  assert.equal(getValue().isVisited('shop-3'), true);

  act(() => {
    getValue().toggleVisited('shop-3');
  });

  assert.equal(getValue().isVisited('shop-3'), false);

  unmount();
});
