import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { normalizeString, includesIgnoreCase } from '../stringUtils';

describe('normalizeString', () => {
  describe('前後の空白をトリム', () => {
    test('前後の空白を除去する', () => {
      assert.equal(normalizeString('  hello  '), 'hello');
    });

    test('先頭の空白のみを除去する', () => {
      assert.equal(normalizeString('  hello'), 'hello');
    });

    test('末尾の空白のみを除去する', () => {
      assert.equal(normalizeString('hello  '), 'hello');
    });

    test('タブや改行も除去する', () => {
      assert.equal(normalizeString('\t\nhello\n\t'), 'hello');
    });

    test('空白のみの文字列は空文字列を返す', () => {
      assert.equal(normalizeString('   '), '');
    });
  });

  describe('小文字に変換', () => {
    test('大文字を小文字に変換する', () => {
      assert.equal(normalizeString('HELLO'), 'hello');
    });

    test('混在した大文字小文字を小文字に変換する', () => {
      assert.equal(normalizeString('HeLLo WoRLd'), 'hello world');
    });

    test('日本語はそのまま保持する', () => {
      assert.equal(normalizeString('こんにちは'), 'こんにちは');
    });

    test('トリムと小文字変換を同時に行う', () => {
      assert.equal(normalizeString('  HELLO WORLD  '), 'hello world');
    });
  });

  describe('その他のケース', () => {
    test('複数の連続した空白文字（内部の空白は保持される）', () => {
      assert.equal(normalizeString('hello   world'), 'hello   world');
    });

    test('改行のみの文字列は空文字列を返す', () => {
      assert.equal(normalizeString('\n\n\n'), '');
    });

    test('タブのみの文字列は空文字列を返す', () => {
      assert.equal(normalizeString('\t\t\t'), '');
    });

    test('1文字の文字列を正しく処理する', () => {
      assert.equal(normalizeString('A'), 'a');
    });

    test('数字と特殊文字は保持する', () => {
      assert.equal(normalizeString('  Test123!@#  '), 'test123!@#');
    });
  });
});

describe('includesIgnoreCase', () => {
  describe('大文字小文字を無視して含まれる場合true', () => {
    test('同じ大文字小文字で含まれる場合true', () => {
      assert.equal(includesIgnoreCase('Hello World', 'World'), true);
    });

    test('大文字小文字が異なっても含まれる場合true', () => {
      assert.equal(includesIgnoreCase('Hello World', 'world'), true);
    });

    test('検索文字列が大文字でも含まれる場合true', () => {
      assert.equal(includesIgnoreCase('hello world', 'WORLD'), true);
    });

    test('部分一致でもtrue', () => {
      assert.equal(includesIgnoreCase('Hello World', 'llo Wor'), true);
    });

    test('先頭一致でもtrue', () => {
      assert.equal(includesIgnoreCase('Hello World', 'hello'), true);
    });

    test('末尾一致でもtrue', () => {
      assert.equal(includesIgnoreCase('Hello World', 'WORLD'), true);
    });
  });

  describe('含まれない場合false', () => {
    test('全く含まれない場合false', () => {
      assert.equal(includesIgnoreCase('Hello World', 'xyz'), false);
    });

    test('部分的に似ていても完全に含まれていなければfalse', () => {
      assert.equal(includesIgnoreCase('Hello', 'Hello World'), false);
    });
  });

  describe('空文字列のケース', () => {
    test('検索文字列が空の場合true', () => {
      assert.equal(includesIgnoreCase('Hello World', ''), true);
    });

    test('対象文字列が空で検索文字列がある場合false', () => {
      assert.equal(includesIgnoreCase('', 'hello'), false);
    });

    test('両方が空の場合true', () => {
      assert.equal(includesIgnoreCase('', ''), true);
    });
  });

  describe('特殊なケース', () => {
    test('特殊文字を含む場合', () => {
      assert.equal(includesIgnoreCase('Hello!@#World', '!@#'), true);
    });

    test('数字を含む場合', () => {
      assert.equal(includesIgnoreCase('Test123Value', '123'), true);
    });

    test('1文字の検索でも機能する', () => {
      assert.equal(includesIgnoreCase('Hello', 'E'), true);
    });

    test('検索文字列と対象文字列が同じ長さの場合', () => {
      assert.equal(includesIgnoreCase('Hello', 'HELLO'), true);
    });

    test('空白を含む検索', () => {
      assert.equal(includesIgnoreCase('Hello World Test', 'o wo'), true);
    });

    test('Unicode絵文字を含む場合', () => {
      assert.equal(includesIgnoreCase('Hello World', ''), true);
    });
  });
});
