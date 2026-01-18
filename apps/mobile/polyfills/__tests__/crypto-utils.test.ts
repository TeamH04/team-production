import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { normalizeAlgorithm, toArrayBuffer, toUint8Array } from '../crypto-utils';

describe('normalizeAlgorithm', () => {
  const testCases: Array<{
    name: string;
    input: Parameters<typeof normalizeAlgorithm>[0];
    expected: string | undefined;
  }> = [
    { name: '文字列 "SHA-256" を大文字に変換', input: 'SHA-256', expected: 'SHA-256' },
    { name: '文字列 "sha-256" を大文字に変換', input: 'sha-256' as 'SHA-256', expected: 'SHA-256' },
    { name: '文字列 "SHA256" を大文字に変換', input: 'SHA256', expected: 'SHA256' },
    {
      name: 'オブジェクト { name: "SHA-256" } から名前を抽出',
      input: { name: 'SHA-256' },
      expected: 'SHA-256',
    },
    {
      name: 'オブジェクト { name: "sha-256" } を大文字に変換',
      input: { name: 'sha-256' },
      expected: 'SHA-256',
    },
    { name: 'nameが空文字列の場合はundefined', input: { name: '' }, expected: undefined },
    { name: 'nameがundefinedの場合はundefined', input: { name: undefined }, expected: undefined },
    {
      name: 'nameプロパティがない場合はundefined',
      input: {} as { name?: string },
      expected: undefined,
    },
  ];

  for (const { name, input, expected } of testCases) {
    test(name, () => {
      assert.equal(normalizeAlgorithm(input), expected);
    });
  }
});

describe('toArrayBuffer', () => {
  describe('ArrayBuffer入力', () => {
    test('ArrayBufferをそのまま返す（同一参照）', () => {
      const buffer = new ArrayBuffer(8);
      const result = toArrayBuffer(buffer);
      // 同一参照であることを確認
      assert.equal(result, buffer);
      // コンテンツも保持されていることを確認
      assert.equal(result.byteLength, 8);
    });

    test('空のArrayBufferをそのまま返す', () => {
      const buffer = new ArrayBuffer(0);
      const result = toArrayBuffer(buffer);
      assert.equal(result, buffer);
      assert.equal(result.byteLength, 0);
    });

    test('データ入りArrayBufferの内容が保持される', () => {
      const buffer = new ArrayBuffer(4);
      const view = new Uint8Array(buffer);
      view.set([1, 2, 3, 4]);
      const result = toArrayBuffer(buffer);
      assert.deepEqual([...new Uint8Array(result)], [1, 2, 3, 4]);
    });
  });

  describe('TypedArray/DataView変換', () => {
    const createTypedArrayCases = () => [
      { name: 'Uint8Array', create: () => new Uint8Array([1, 2, 3, 4]), expectedLength: 4 },
      { name: '空のUint8Array', create: () => new Uint8Array([]), expectedLength: 0 },
      { name: 'Int16Array', create: () => new Int16Array([100, 200]), expectedLength: 4 },
      { name: 'DataView', create: () => new DataView(new ArrayBuffer(8), 0, 4), expectedLength: 4 },
    ];

    for (const { name, create, expectedLength } of createTypedArrayCases()) {
      test(`${name}をArrayBufferに変換`, () => {
        const result = toArrayBuffer(create());
        assert.ok(result instanceof ArrayBuffer);
        assert.equal(result.byteLength, expectedLength);
      });
    }
  });

  test('Uint8Array変換後のデータ内容が正しい', () => {
    const uint8 = new Uint8Array([1, 2, 3, 4]);
    const result = toArrayBuffer(uint8);
    assert.deepEqual([...new Uint8Array(result)], [1, 2, 3, 4]);
  });

  test('オフセット付きUint8Arrayを正しく変換', () => {
    const buffer = new ArrayBuffer(8);
    const uint8 = new Uint8Array(buffer, 2, 4);
    uint8.set([10, 20, 30, 40]);
    const result = toArrayBuffer(uint8);
    assert.equal(result.byteLength, 4);
    assert.deepEqual([...new Uint8Array(result)], [10, 20, 30, 40]);
  });

  describe('エラーハンドリング', () => {
    test('サポートされていない型でTypeErrorをスロー', () => {
      assert.throws(
        // @ts-expect-error - テスト用に不正な型を渡す
        () => toArrayBuffer('invalid'),
        { name: 'TypeError', message: 'Unsupported BufferSource type' },
      );
    });

    test('nullでTypeErrorをスロー', () => {
      assert.throws(
        // @ts-expect-error - テスト用に不正な型を渡す
        () => toArrayBuffer(null),
        { name: 'TypeError' },
      );
    });

    test('undefinedでTypeErrorをスロー', () => {
      assert.throws(
        // @ts-expect-error - テスト用に不正な型を渡す
        () => toArrayBuffer(undefined),
        { name: 'TypeError' },
      );
    });

    test('数値でTypeErrorをスロー', () => {
      assert.throws(
        // @ts-expect-error - テスト用に不正な型を渡す
        () => toArrayBuffer(123),
        { name: 'TypeError' },
      );
    });

    test('オブジェクトでTypeErrorをスロー', () => {
      assert.throws(
        // @ts-expect-error - テスト用に不正な型を渡す
        () => toArrayBuffer({ data: [1, 2, 3] }),
        { name: 'TypeError' },
      );
    });
  });
});

describe('toUint8Array', () => {
  describe('Uint8Array入力', () => {
    test('Uint8Arrayをそのまま返す（同一参照）', () => {
      const uint8 = new Uint8Array([1, 2, 3]);
      const result = toUint8Array(uint8);
      // 同一参照であることを確認
      assert.equal(result, uint8);
      // コンテンツも保持されていることを確認
      assert.deepEqual([...result], [1, 2, 3]);
    });

    test('空のUint8Arrayをそのまま返す', () => {
      const uint8 = new Uint8Array([]);
      const result = toUint8Array(uint8);
      assert.equal(result, uint8);
      assert.equal(result.byteLength, 0);
    });
  });

  describe('ArrayBuffer入力', () => {
    test('ArrayBufferをUint8Arrayに変換', () => {
      const buffer = new ArrayBuffer(4);
      const result = toUint8Array(buffer);
      assert.ok(result instanceof Uint8Array);
      assert.equal(result.byteLength, 4);
    });

    test('データ入りArrayBufferの内容が保持される', () => {
      const buffer = new ArrayBuffer(4);
      new Uint8Array(buffer).set([10, 20, 30, 40]);
      const result = toUint8Array(buffer);
      assert.deepEqual([...result], [10, 20, 30, 40]);
    });

    test('空のArrayBufferを変換', () => {
      const buffer = new ArrayBuffer(0);
      const result = toUint8Array(buffer);
      assert.ok(result instanceof Uint8Array);
      assert.equal(result.byteLength, 0);
    });
  });

  describe('TypedArray入力', () => {
    test('オフセット付きTypedArrayを正しく変換', () => {
      const buffer = new ArrayBuffer(8);
      const view = new Uint8Array(buffer, 2, 4);
      view.set([5, 6, 7, 8]);
      const result = toUint8Array(view);
      assert.equal(result.byteLength, 4);
      assert.deepEqual([...result], [5, 6, 7, 8]);
    });

    test('Int16ArrayをUint8Arrayに変換', () => {
      const int16 = new Int16Array([256, 512]);
      const result = toUint8Array(int16);
      assert.ok(result instanceof Uint8Array);
      assert.equal(result.byteLength, 4);
    });
  });

  describe('エラーハンドリング', () => {
    test('サポートされていない型でTypeErrorをスロー', () => {
      assert.throws(
        // @ts-expect-error - テスト用に不正な型を渡す
        () => toUint8Array('invalid'),
        { name: 'TypeError', message: 'Unsupported BufferSource type' },
      );
    });

    test('nullでTypeErrorをスロー', () => {
      assert.throws(
        // @ts-expect-error - テスト用に不正な型を渡す
        () => toUint8Array(null),
        { name: 'TypeError' },
      );
    });

    test('undefinedでTypeErrorをスロー', () => {
      assert.throws(
        // @ts-expect-error - テスト用に不正な型を渡す
        () => toUint8Array(undefined),
        { name: 'TypeError' },
      );
    });
  });
});
