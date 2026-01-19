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

  describe('タイムゾーンを考慮した変換（環境依存）', () => {
    test('UTC時刻を含むISO文字列がDateオブジェクトとして正しくパースされる', () => {
      // Dateオブジェクトとして正しくパースされることを確認
      const dateObj = new Date('2024-01-14T15:00:00Z');
      const result = formatDateJa(dateObj);
      // 結果が有効な日付フォーマット（YYYY/M/D）であることを確認
      assert.match(result, /^\d{4}\/\d{1,2}\/\d{1,2}$/);
    });

    test('ミリ秒を含むISO文字列が正しくパースされる', () => {
      const dateObj = new Date('2024-07-20T12:30:45.123Z');
      const result = formatDateJa(dateObj);
      // 結果が有効な日付フォーマットであることを確認
      assert.match(result, /^\d{4}\/\d{1,2}\/\d{1,2}$/);
      // Dateオブジェクトが正しく作成されていることを確認
      assert.equal(dateObj.getUTCFullYear(), 2024);
      assert.equal(dateObj.getUTCMonth(), 6); // 7月は0-indexed
      assert.equal(dateObj.getUTCDate(), 20);
    });

    test('ISO文字列とDateオブジェクトで同じ結果を返す', () => {
      const isoString = '2024-06-15T00:00:00';
      const dateObj = new Date(isoString);
      assert.equal(formatDateJa(isoString), formatDateJa(dateObj));
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

  describe('不正な日付文字列の処理', () => {
    test('不正な文字列は "Invalid Date" を含む結果を返す', () => {
      const result = formatDateJa('invalid-date');
      assert.equal(result, 'Invalid Date');
    });

    test('空文字列は "Invalid Date" を含む結果を返す', () => {
      const result = formatDateJa('');
      assert.equal(result, 'Invalid Date');
    });
  });

  describe('エッジケース', () => {
    test('エポック日付（1970-01-01）', () => {
      const date = new Date(0);
      const result = formatDateJa(date);
      // 結果が有効な日付フォーマットであることを確認
      assert.match(result, /^\d{4}\/\d{1,2}\/\d{1,2}$/);
      // UTCでは1970/1/1だが、ローカルタイムゾーンによって日付が異なる可能性がある
      assert.equal(date.getUTCFullYear(), 1970);
      assert.equal(date.getUTCMonth(), 0);
      assert.equal(date.getUTCDate(), 1);
    });

    test('エポック日付（ISO文字列）', () => {
      const result = formatDateJa('1970-01-01');
      assert.equal(result, '1970/1/1');
    });

    test('極端な未来の日付（9999-12-31）', () => {
      const date = new Date(9999, 11, 31);
      assert.equal(formatDateJa(date), '9999/12/31');
    });

    test('極端な未来の日付（ISO文字列）', () => {
      const result = formatDateJa('9999-12-31');
      assert.equal(result, '9999/12/31');
    });
  });
});
