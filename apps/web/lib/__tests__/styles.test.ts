import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import { createNavigateToHomeAction, REVIEW_LIMITS, STYLES } from '../styles';

describe('styles', () => {
  describe('STYLES', () => {
    test('PAGE_BACKGROUNDが定義されている', () => {
      expect(STYLES.PAGE_BACKGROUND).toMatch(/bg-slate/);
      expect(STYLES.PAGE_BACKGROUND).toMatch(/min-h-screen/);
    });

    test('CONTAINERが定義されている', () => {
      expect(STYLES.CONTAINER).toMatch(/mx-auto/);
      expect(STYLES.CONTAINER).toMatch(/max-w-/);
      expect(STYLES.CONTAINER).toMatch(/px-/);
    });

    test('HEADER_GRADIENTが定義されている', () => {
      expect(STYLES.HEADER_GRADIENT).toContain('bg-gradient-to-br');
    });

    test('CARDが定義されている', () => {
      expect(STYLES.CARD).toContain('rounded-3xl');
      expect(STYLES.CARD).toContain('bg-white');
    });

    test('SEARCH_INPUTが定義されている', () => {
      expect(STYLES.SEARCH_INPUT).toContain('rounded-2xl');
    });

    test('BUTTON_PRIMARYが定義されている', () => {
      expect(STYLES.BUTTON_PRIMARY).toContain('rounded-full');
      expect(STYLES.BUTTON_PRIMARY).toContain('bg-slate-900');
    });

    test('SECTION_LABELが定義されている', () => {
      expect(STYLES.SECTION_LABEL).toContain('text-sm');
      expect(STYLES.SECTION_LABEL).toContain('uppercase');
    });

    test('PAGE_TITLEが定義されている', () => {
      expect(STYLES.PAGE_TITLE).toContain('text-3xl');
      expect(STYLES.PAGE_TITLE).toContain('font-bold');
    });
  });

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
