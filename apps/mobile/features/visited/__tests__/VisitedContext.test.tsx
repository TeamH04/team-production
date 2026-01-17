import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { act, createContextHarness, type ContextHarness } from '@/test-utils';

import { useVisited, VisitedProvider } from '../VisitedContext';

describe('VisitedContext', () => {
  test('useVisited throws outside VisitedProvider', () => {
    assert.throws(() => {
      createContextHarness(useVisited, ({ children }) => <>{children}</>);
    }, /useVisited must be used within VisitedProvider/);
  });

  describe('addVisited', () => {
    test('marks a shop as visited', () => {
      const harness: ContextHarness<ReturnType<typeof useVisited>> = createContextHarness(
        useVisited,
        VisitedProvider,
      );

      act(() => {
        harness.getValue().addVisited('shop-1');
      });

      assert.equal(harness.getValue().isVisited('shop-1'), true);
      assert.equal(harness.getValue().visited.has('shop-1'), true);

      harness.unmount();
    });
  });

  describe('removeVisited', () => {
    test('removes a shop from visited', () => {
      const harness: ContextHarness<ReturnType<typeof useVisited>> = createContextHarness(
        useVisited,
        VisitedProvider,
      );

      act(() => {
        harness.getValue().addVisited('shop-2');
      });

      act(() => {
        harness.getValue().removeVisited('shop-2');
      });

      assert.equal(harness.getValue().isVisited('shop-2'), false);
      assert.equal(harness.getValue().visited.has('shop-2'), false);

      harness.unmount();
    });
  });

  describe('toggleVisited', () => {
    test('adds and removes a shop', () => {
      const harness: ContextHarness<ReturnType<typeof useVisited>> = createContextHarness(
        useVisited,
        VisitedProvider,
      );

      act(() => {
        harness.getValue().toggleVisited('shop-3');
      });

      assert.equal(harness.getValue().isVisited('shop-3'), true);

      act(() => {
        harness.getValue().toggleVisited('shop-3');
      });

      assert.equal(harness.getValue().isVisited('shop-3'), false);

      harness.unmount();
    });
  });
});
