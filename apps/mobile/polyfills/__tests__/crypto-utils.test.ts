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
  test('ArrayBufferをそのまま返す', () => {
    const buffer = new ArrayBuffer(8);
    assert.equal(toArrayBuffer(buffer), buffer);
  });

  test('空のArrayBufferをそのまま返す', () => {
    const buffer = new ArrayBuffer(0);
    assert.equal(toArrayBuffer(buffer), buffer);
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

  test('サポートされていない型でTypeErrorをスロー', () => {
    assert.throws(
      // @ts-expect-error - テスト用に不正な型を渡す
      () => toArrayBuffer('invalid'),
      { name: 'TypeError', message: 'Unsupported BufferSource type' },
    );
  });
});

describe('toUint8Array', () => {
  test('Uint8Arrayをそのまま返す', () => {
    const uint8 = new Uint8Array([1, 2, 3]);
    assert.equal(toUint8Array(uint8), uint8);
  });

  test('ArrayBufferをUint8Arrayに変換', () => {
    const buffer = new ArrayBuffer(4);
    const result = toUint8Array(buffer);
    assert.ok(result instanceof Uint8Array);
    assert.equal(result.byteLength, 4);
  });

  test('オフセット付きTypedArrayを正しく変換', () => {
    const buffer = new ArrayBuffer(8);
    const view = new Uint8Array(buffer, 2, 4);
    view.set([5, 6, 7, 8]);
    const result = toUint8Array(view);
    assert.equal(result.byteLength, 4);
    assert.deepEqual([...result], [5, 6, 7, 8]);
  });
});
