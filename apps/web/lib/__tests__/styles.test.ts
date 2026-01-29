import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import { createNavigateToHomeAction } from '../navigation';
import { REVIEW_LIMITS } from '../styles';

describe('styles', () => {
  describe('REVIEW_LIMITS', () => {
    test('MAX_VISIBLE_REVIEWSが正の整数である', () => {
      expect(Number.isInteger(REVIEW_LIMITS.MAX_VISIBLE_REVIEWS)).toBe(true);
      expect(REVIEW_LIMITS.MAX_VISIBLE_REVIEWS).toBeGreaterThan(0);
    });

    test('MAX_SIDEBAR_REVIEWSが正の整数である', () => {
      expect(Number.isInteger(REVIEW_LIMITS.MAX_SIDEBAR_REVIEWS)).toBe(true);
      expect(REVIEW_LIMITS.MAX_SIDEBAR_REVIEWS).toBeGreaterThan(0);
    });

    test('MAX_VISIBLE_REVIEWSがMAX_SIDEBAR_REVIEWSより大きい', () => {
      expect(REVIEW_LIMITS.MAX_VISIBLE_REVIEWS).toBeGreaterThan(REVIEW_LIMITS.MAX_SIDEBAR_REVIEWS);
    });
  });

  describe('createNavigateToHomeAction', () => {
    const originalLocation = window.location;

    beforeEach(() => {
      Object.defineProperty(window, 'location', {
        value: { href: '' },
        writable: true,
        configurable: true,
      });
    });

    afterEach(() => {
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
        configurable: true,
      });
    });

    test('labelが「お店を探す」', () => {
      const action = createNavigateToHomeAction();

      expect(action.label).toBe('お店を探す');
    });

    test('onClickでホームに遷移する', () => {
      const action = createNavigateToHomeAction();
      action.onClick();

      expect(window.location.href).toBe('/');
    });

    test('毎回新しいオブジェクトを返す', () => {
      const action1 = createNavigateToHomeAction();
      const action2 = createNavigateToHomeAction();

      expect(action1).not.toBe(action2);
    });
  });
});
