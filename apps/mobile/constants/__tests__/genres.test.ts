import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { GENRES, toggleGenre, type Genre } from '@team/constants';

describe('GENRES', () => {
  test('ジャンル一覧が空ではない', () => {
    assert.ok(GENRES.length > 0);
  });

  test('全てのジャンルが文字列である', () => {
    for (const genre of GENRES) {
      assert.equal(typeof genre, 'string');
    }
  });

  test('重複するジャンルがない', () => {
    const uniqueGenres = new Set(GENRES);
    assert.equal(uniqueGenres.size, GENRES.length);
  });
});

describe('toggleGenre', () => {
  const testCases: Array<{
    name: string;
    input: Genre[];
    genre: Genre;
    expected: Genre[];
  }> = [
    { name: '空配列にジャンルを追加', input: [], genre: 'カフェ', expected: ['カフェ'] },
    {
      name: '存在するジャンルを削除',
      input: ['カフェ', '和食'],
      genre: 'カフェ',
      expected: ['和食'],
    },
    {
      name: '既存のジャンル配列に追加',
      input: ['カフェ'],
      genre: '和食',
      expected: ['カフェ', '和食'],
    },
    {
      name: '配列中央の要素を削除',
      input: ['カフェ', '和食', 'イタリアン'],
      genre: '和食',
      expected: ['カフェ', 'イタリアン'],
    },
    {
      name: '配列末尾の要素を削除',
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

  test('元の配列を変更しない（イミュータブル）', () => {
    const original: Genre[] = ['カフェ', '和食'];
    const result = toggleGenre(original, 'カフェ');

    assert.deepEqual(original, ['カフェ', '和食']);
    assert.deepEqual(result, ['和食']);
  });

  test('2回toggleで元の状態に戻る', () => {
    const initial: Genre[] = [];
    const afterAdd = toggleGenre(initial, 'フレンチ');
    const afterRemove = toggleGenre(afterAdd, 'フレンチ');

    assert.deepEqual(afterRemove, []);
  });

  test('全ジャンル選択時にジャンルを削除できる', () => {
    const allGenres = [...GENRES];
    const result = toggleGenre(allGenres, GENRES[0]);

    assert.equal(result.length, GENRES.length - 1);
    assert.ok(!result.includes(GENRES[0]));
  });

  test('全ジャンル選択済みでも追加操作は動作する（重複追加）', () => {
    const allGenres = [...GENRES];
    const newGenre = GENRES[0];
    // 一旦削除してから追加
    const withoutFirst = toggleGenre(allGenres, newGenre);
    const restored = toggleGenre(withoutFirst, newGenre);

    assert.equal(restored.length, GENRES.length);
    assert.ok(restored.includes(newGenre));
  });

  test('単一要素の配列から削除で空配列になる', () => {
    const single: Genre[] = ['カフェ'];
    const result = toggleGenre(single, 'カフェ');

    assert.deepEqual(result, []);
  });
});
