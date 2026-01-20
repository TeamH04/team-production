import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { getRatingDisplay } from '../review';

describe('getRatingDisplay', () => {
  describe('rating 5 の場合', () => {
    test('satisfied を返す', () => {
      const result = getRatingDisplay(5);
      assert.deepEqual(result, {
        icon: 'happy',
        label: '満足',
        sentiment: 'satisfied',
      });
    });

    test('icon が happy である', () => {
      assert.equal(getRatingDisplay(5).icon, 'happy');
    });

    test('label が 満足 である', () => {
      assert.equal(getRatingDisplay(5).label, '満足');
    });

    test('sentiment が satisfied である', () => {
      assert.equal(getRatingDisplay(5).sentiment, 'satisfied');
    });
  });

  describe('rating 4 の場合', () => {
    test('neutral を返す', () => {
      const result = getRatingDisplay(4);
      assert.deepEqual(result, {
        icon: 'remove',
        label: '普通',
        sentiment: 'neutral',
      });
    });

    test('icon が remove である', () => {
      assert.equal(getRatingDisplay(4).icon, 'remove');
    });

    test('label が 普通 である', () => {
      assert.equal(getRatingDisplay(4).label, '普通');
    });

    test('sentiment が neutral である', () => {
      assert.equal(getRatingDisplay(4).sentiment, 'neutral');
    });
  });

  describe('rating 3 以下の場合', () => {
    test('rating 3 で dissatisfied を返す', () => {
      const result = getRatingDisplay(3);
      assert.deepEqual(result, {
        icon: 'sad',
        label: '不満',
        sentiment: 'dissatisfied',
      });
    });

    test('icon が sad である', () => {
      assert.equal(getRatingDisplay(3).icon, 'sad');
    });

    test('label が 不満 である', () => {
      assert.equal(getRatingDisplay(3).label, '不満');
    });

    test('sentiment が dissatisfied である', () => {
      assert.equal(getRatingDisplay(3).sentiment, 'dissatisfied');
    });
  });

  describe('エッジケース', () => {
    test('rating 1 で dissatisfied を返す', () => {
      const result = getRatingDisplay(1);
      assert.deepEqual(result, {
        icon: 'sad',
        label: '不満',
        sentiment: 'dissatisfied',
      });
    });

    test('rating 2 で dissatisfied を返す', () => {
      const result = getRatingDisplay(2);
      assert.deepEqual(result, {
        icon: 'sad',
        label: '不満',
        sentiment: 'dissatisfied',
      });
    });

    test('rating 0 で dissatisfied を返す', () => {
      const result = getRatingDisplay(0);
      assert.deepEqual(result, {
        icon: 'sad',
        label: '不満',
        sentiment: 'dissatisfied',
      });
    });

    test('負の値で dissatisfied を返す', () => {
      const result = getRatingDisplay(-1);
      assert.deepEqual(result, {
        icon: 'sad',
        label: '不満',
        sentiment: 'dissatisfied',
      });
    });
  });
});
