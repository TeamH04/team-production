import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { extractErrorMessage } from '../extractErrorMessage';

const defaultMessage = 'エラーが発生しました';

describe('extractErrorMessage', () => {
  describe('Errorインスタンスからメッセージを抽出', () => {
    test('Errorインスタンスのmessageを返す', () => {
      const error = new Error('テストエラー');
      assert.equal(extractErrorMessage(error, defaultMessage), 'テストエラー');
    });

    test('TypeErrorからもメッセージを抽出できる', () => {
      const error = new TypeError('型エラー');
      assert.equal(extractErrorMessage(error, defaultMessage), '型エラー');
    });

    test('RangeErrorからメッセージを抽出できる', () => {
      const error = new RangeError('範囲外エラー');
      assert.equal(extractErrorMessage(error, defaultMessage), '範囲外エラー');
    });

    test('SyntaxErrorからメッセージを抽出できる', () => {
      const error = new SyntaxError('構文エラー');
      assert.equal(extractErrorMessage(error, defaultMessage), '構文エラー');
    });

    test('空のメッセージを持つErrorも正しく処理する', () => {
      const error = new Error('');
      assert.equal(extractErrorMessage(error, defaultMessage), '');
    });
  });

  describe('文字列エラーをそのまま返す', () => {
    test('文字列をそのまま返す', () => {
      assert.equal(extractErrorMessage('文字列エラー', defaultMessage), '文字列エラー');
    });

    test('空文字列もそのまま返す', () => {
      assert.equal(extractErrorMessage('', defaultMessage), '');
    });

    test('非常に大きなメッセージも正しく処理する', () => {
      const largeMessage = 'あ'.repeat(10000);
      assert.equal(extractErrorMessage(largeMessage, defaultMessage), largeMessage);
    });
  });

  describe('その他の型はデフォルトメッセージを返す', () => {
    test('数値の場合はデフォルトメッセージを返す', () => {
      assert.equal(extractErrorMessage(123, defaultMessage), defaultMessage);
    });

    test('オブジェクトの場合はデフォルトメッセージを返す', () => {
      assert.equal(extractErrorMessage({ message: 'エラー' }, defaultMessage), defaultMessage);
    });

    test('配列の場合はデフォルトメッセージを返す', () => {
      assert.equal(extractErrorMessage(['エラー'], defaultMessage), defaultMessage);
    });

    test('booleanの場合はデフォルトメッセージを返す', () => {
      assert.equal(extractErrorMessage(true, defaultMessage), defaultMessage);
    });

    test('Symbol型の場合はデフォルトメッセージを返す', () => {
      assert.equal(extractErrorMessage(Symbol('test'), defaultMessage), defaultMessage);
    });

    test('messageプロパティを持つ非Errorオブジェクトはデフォルトメッセージを返す', () => {
      const errorLike = { message: 'エラーメッセージ', name: 'CustomError' };
      assert.equal(extractErrorMessage(errorLike, defaultMessage), defaultMessage);
    });
  });

  describe('nullやundefinedはデフォルトメッセージを返す', () => {
    test('nullの場合はデフォルトメッセージを返す', () => {
      assert.equal(extractErrorMessage(null, defaultMessage), defaultMessage);
    });

    test('undefinedの場合はデフォルトメッセージを返す', () => {
      assert.equal(extractErrorMessage(undefined, defaultMessage), defaultMessage);
    });
  });
});
