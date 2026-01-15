import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { GENRES, toggleGenre } from '../genres';

describe('GENRES', () => {
  test('contains 10 genres', () => {
    assert.equal(GENRES.length, 10);
  });
});

describe('toggleGenre', () => {
  const testCases: Array<{
    name: string;
    input: string[];
    genre: string;
    expected: string[];
  }> = [
    { name: 'adds a genre when not present', input: [], genre: 'カフェ', expected: ['カフェ'] },
    {
      name: 'removes a genre when present',
      input: ['カフェ', '和食'],
      genre: 'カフェ',
      expected: ['和食'],
    },
    {
      name: 'adds to existing genres',
      input: ['カフェ'],
      genre: '和食',
      expected: ['カフェ', '和食'],
    },
    {
      name: 'removes element from middle of array',
      input: ['カフェ', '和食', 'イタリアン'],
      genre: '和食',
      expected: ['カフェ', 'イタリアン'],
    },
    {
      name: 'removes last element from array',
      input: ['カフェ', '和食'],
      genre: '和食',
      expected: ['カフェ'],
    },
  ];

  for (const { name, input, genre, expected } of testCases) {
    test(name, () => {
      assert.deepEqual(toggleGenre(input, genre), expected);
    });
  }

  test('does not mutate original array', () => {
    const original = ['カフェ', '和食'];
    const result = toggleGenre(original, 'カフェ');

    assert.deepEqual(original, ['カフェ', '和食']);
    assert.deepEqual(result, ['和食']);
  });

  test('toggle twice returns to original state', () => {
    const initial: string[] = [];
    const afterAdd = toggleGenre(initial, 'フレンチ');
    const afterRemove = toggleGenre(afterAdd, 'フレンチ');

    assert.deepEqual(afterRemove, []);
  });
});
