import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, test } from 'node:test';

import { act, createContextHarness, type ContextHarness } from '@/test-utils';

import { useVisited, VisitedProvider } from '../VisitedContext';

describe('VisitedContext', () => {
  let harness: ContextHarness<ReturnType<typeof useVisited>> | undefined;

  beforeEach(() => {
    harness = createContextHarness(useVisited, VisitedProvider);
  });

  afterEach(() => {
    harness?.unmount();
    harness = undefined;
  });

  test('useVisited throws outside VisitedProvider', () => {
    harness?.unmount();
    harness = undefined;

    assert.throws(() => {
      createContextHarness(useVisited, ({ children }) => <>{children}</>);
    }, /useVisited must be used within VisitedProvider/);
  });

  describe('初期状態', () => {
    test('訪問済みリストが空', () => {
      assert.equal(harness!.getValue().visited.size, 0);
    });
  });

  describe('addVisited', () => {
    test('店舗を訪問済みにする', () => {
      act(() => {
        harness!.getValue().addVisited('shop-1');
      });

      assert.equal(harness!.getValue().isVisited('shop-1'), true);
    });

    test('同じ店舗を複数回追加しても1つだけ', () => {
      act(() => {
        harness!.getValue().addVisited('shop-1');
        harness!.getValue().addVisited('shop-1');
      });

      assert.equal(harness!.getValue().visited.size, 1);
    });

    test('複数の店舗を追加できる', () => {
      act(() => {
        harness!.getValue().addVisited('shop-1');
        harness!.getValue().addVisited('shop-2');
        harness!.getValue().addVisited('shop-3');
      });

      assert.equal(harness!.getValue().visited.size, 3);
    });

    test('空文字の店舗IDも追加できる', () => {
      act(() => {
        harness!.getValue().addVisited('');
      });

      assert.equal(harness!.getValue().isVisited(''), true);
    });
  });

  describe('removeVisited', () => {
    test('訪問済みから店舗を削除する', () => {
      act(() => {
        harness!.getValue().addVisited('shop-2');
      });

      act(() => {
        harness!.getValue().removeVisited('shop-2');
      });

      assert.equal(harness!.getValue().isVisited('shop-2'), false);
    });

    test('存在しない店舗の削除は何もしない', () => {
      act(() => {
        harness!.getValue().addVisited('shop-1');
      });

      act(() => {
        harness!.getValue().removeVisited('non-existent');
      });

      assert.equal(harness!.getValue().visited.size, 1);
      assert.equal(harness!.getValue().isVisited('shop-1'), true);
    });
  });

  describe('toggleVisited', () => {
    test('未訪問の店舗を訪問済みにする', () => {
      act(() => {
        harness!.getValue().toggleVisited('shop-3');
      });

      assert.equal(harness!.getValue().isVisited('shop-3'), true);
    });

    test('訪問済みの店舗を未訪問にする', () => {
      act(() => {
        harness!.getValue().addVisited('shop-3');
      });

      act(() => {
        harness!.getValue().toggleVisited('shop-3');
      });

      assert.equal(harness!.getValue().isVisited('shop-3'), false);
    });

    test('連続toggleで状態が交互に切り替わる', () => {
      act(() => {
        harness!.getValue().toggleVisited('shop-4');
      });
      assert.equal(harness!.getValue().isVisited('shop-4'), true);

      act(() => {
        harness!.getValue().toggleVisited('shop-4');
      });
      assert.equal(harness!.getValue().isVisited('shop-4'), false);

      act(() => {
        harness!.getValue().toggleVisited('shop-4');
      });
      assert.equal(harness!.getValue().isVisited('shop-4'), true);
    });
  });

  describe('isVisited', () => {
    test('訪問済みの店舗はtrueを返す', () => {
      act(() => {
        harness!.getValue().addVisited('shop-1');
      });

      assert.equal(harness!.getValue().isVisited('shop-1'), true);
    });

    test('未訪問の店舗はfalseを返す', () => {
      assert.equal(harness!.getValue().isVisited('unknown-shop'), false);
    });

    test('空文字のIDを正しく判定する', () => {
      assert.equal(harness!.getValue().isVisited(''), false);

      act(() => {
        harness!.getValue().addVisited('');
      });

      assert.equal(harness!.getValue().isVisited(''), true);
    });
  });
});
