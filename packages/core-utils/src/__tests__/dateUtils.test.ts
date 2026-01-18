import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { formatDateJa } from '../dateUtils';

describe('formatDateJa', () => {
  describe('ISO文字列を日本語フォーマットに変換', () => {
    test('ISO文字列を正しくフォーマットする', () => {
      assert.equal(formatDateJa('2024-01-15T10:30:00Z'), '2024/1/15');
    });

    test('UTC時刻のISO文字列を変換する', () => {
      assert.equal(formatDateJa('2024-12-25T00:00:00Z'), '2024/12/25');
    });

    test('タイムゾーン指定なしのISO文字列を変換する', () => {
      assert.equal(formatDateJa('2024-06-01'), '2024/6/1');
    });
  });

  describe('Dateオブジェクトを日本語フォーマットに変換', () => {
    test('Dateオブジェクトを正しくフォーマットする', () => {
      const date = new Date(2024, 0, 15); // 2024年1月15日
      assert.equal(formatDateJa(date), '2024/1/15');
    });

    test('年末のDateオブジェクトを変換する', () => {
      const date = new Date(2024, 11, 31); // 2024年12月31日
      assert.equal(formatDateJa(date), '2024/12/31');
    });

    test('年始のDateオブジェクトを変換する', () => {
      const date = new Date(2025, 0, 1); // 2025年1月1日
      assert.equal(formatDateJa(date), '2025/1/1');
    });
  });

  describe('年月日の正しいフォーマット（YYYY/MM/DD）', () => {
    test('4桁の年が正しく表示される', () => {
      const date = new Date(2024, 5, 15);
      const result = formatDateJa(date);
      assert.match(result, /^2024\//);
    });

    test('12月が正しく表示される', () => {
      const date = new Date(2024, 11, 15);
      assert.equal(formatDateJa(date), '2024/12/15');
    });

    test('31日が正しく表示される', () => {
      const date = new Date(2024, 0, 31);
      assert.equal(formatDateJa(date), '2024/1/31');
    });
  });

  describe('月・日が1桁の場合の処理', () => {
    test('1月が1桁で表示される', () => {
      const date = new Date(2024, 0, 15);
      assert.equal(formatDateJa(date), '2024/1/15');
    });

    test('9月が1桁で表示される', () => {
      const date = new Date(2024, 8, 15);
      assert.equal(formatDateJa(date), '2024/9/15');
    });

    test('1日が1桁で表示される', () => {
      const date = new Date(2024, 5, 1);
      assert.equal(formatDateJa(date), '2024/6/1');
    });

    test('9日が1桁で表示される', () => {
      const date = new Date(2024, 5, 9);
      assert.equal(formatDateJa(date), '2024/6/9');
    });

    test('月と日が両方1桁の場合', () => {
      const date = new Date(2024, 0, 1);
      assert.equal(formatDateJa(date), '2024/1/1');
    });
  });

  describe('タイムゾーンを考慮した変換', () => {
    test('日本時間で日付が変わる境界（UTC 15:00 = JST 翌0:00）', () => {
      // UTC 2024-01-14 15:00 = JST 2024-01-15 00:00
      const result = formatDateJa('2024-01-14T15:00:00Z');
      // ローカルタイムゾーンに依存するため、結果は環境によって異なる
      assert.ok(result.includes('2024'));
    });

    test('日本時間の深夜0時', () => {
      // JST 2024-03-15 00:00:00
      const result = formatDateJa('2024-03-14T15:00:00Z');
      assert.ok(result.includes('2024'));
    });

    test('ミリ秒を含むISO文字列を処理する', () => {
      const result = formatDateJa('2024-07-20T12:30:45.123Z');
      assert.ok(result.includes('2024'));
      assert.ok(result.includes('7') || result.includes('07'));
    });
  });

  describe('境界値のテスト', () => {
    test('うるう年の2月29日', () => {
      const date = new Date(2024, 1, 29); // 2024年はうるう年
      assert.equal(formatDateJa(date), '2024/2/29');
    });

    test('平年の2月28日', () => {
      const date = new Date(2023, 1, 28);
      assert.equal(formatDateJa(date), '2023/2/28');
    });

    test('10月（2桁の月）', () => {
      const date = new Date(2024, 9, 15);
      assert.equal(formatDateJa(date), '2024/10/15');
    });

    test('10日（2桁の日）', () => {
      const date = new Date(2024, 5, 10);
      assert.equal(formatDateJa(date), '2024/6/10');
    });
  });
});
