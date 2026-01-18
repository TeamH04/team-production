import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { toggleArrayItem, addToArray, removeFromArray } from '../arrayUtils';

describe('toggleArrayItem', () => {
  describe('配列のトグル', () => {
    test('存在しないアイテムを追加する', () => {
      const arr = [1, 2, 3];
      const result = toggleArrayItem(arr, 4);
      assert.deepEqual(result, [1, 2, 3, 4]);
    });

    test('存在するアイテムを削除する', () => {
      const arr = [1, 2, 3];
      const result = toggleArrayItem(arr, 2);
      assert.deepEqual(result, [1, 3]);
    });

    test('空配列にアイテムを追加する', () => {
      const arr: number[] = [];
      const result = toggleArrayItem(arr, 1);
      assert.deepEqual(result, [1]);
    });

    test('1つのアイテムのみの配列からトグルで削除する', () => {
      const arr = [1];
      const result = toggleArrayItem(arr, 1);
      assert.deepEqual(result, []);
    });

    test('文字列配列でも動作する', () => {
      const arr = ['a', 'b', 'c'];
      assert.deepEqual(toggleArrayItem(arr, 'd'), ['a', 'b', 'c', 'd']);
      assert.deepEqual(toggleArrayItem(arr, 'b'), ['a', 'c']);
    });
  });

  describe('イミュータビリティ', () => {
    test('元の配列がミューテートされない', () => {
      const arr = [1, 2, 3];
      const original = [...arr];
      toggleArrayItem(arr, 4);
      assert.deepEqual(arr, original);
    });

    test('削除時も元の配列がミューテートされない', () => {
      const arr = [1, 2, 3];
      const original = [...arr];
      toggleArrayItem(arr, 2);
      assert.deepEqual(arr, original);
    });
  });

  describe('オブジェクト参照の比較', () => {
    test('オブジェクト参照が同じ場合に削除される', () => {
      const obj1 = { id: 1 };
      const obj2 = { id: 2 };
      const arr = [obj1, obj2];
      const result = toggleArrayItem(arr, obj1);
      assert.deepEqual(result, [obj2]);
    });

    test('オブジェクトの値が同じでも参照が異なれば追加される', () => {
      const obj1 = { id: 1 };
      const obj2 = { id: 2 };
      const arr = [obj1, obj2];
      const newObj = { id: 1 }; // 値は同じだが参照が異なる
      const result = toggleArrayItem(arr, newObj);
      assert.deepEqual(result, [obj1, obj2, newObj]);
    });
  });
});

describe('addToArray', () => {
  describe('配列への追加', () => {
    test('存在しないアイテムを追加する', () => {
      const arr = [1, 2, 3];
      const result = addToArray(arr, 4);
      assert.deepEqual(result, [1, 2, 3, 4]);
    });

    test('既存アイテムは重複追加しない', () => {
      const arr = [1, 2, 3];
      const result = addToArray(arr, 2);
      assert.deepEqual(result, [1, 2, 3]);
    });

    test('空配列にアイテムを追加する', () => {
      const arr: number[] = [];
      const result = addToArray(arr, 1);
      assert.deepEqual(result, [1]);
    });

    test('文字列配列でも動作する', () => {
      const arr = ['a', 'b'];
      assert.deepEqual(addToArray(arr, 'c'), ['a', 'b', 'c']);
      assert.deepEqual(addToArray(arr, 'a'), ['a', 'b']);
    });
  });

  describe('イミュータビリティ', () => {
    test('新しいアイテム追加時に元の配列がミューテートされない', () => {
      const arr = [1, 2, 3];
      const original = [...arr];
      addToArray(arr, 4);
      assert.deepEqual(arr, original);
    });

    test('既存アイテム追加時も元の配列がミューテートされない', () => {
      const arr = [1, 2, 3];
      const original = [...arr];
      addToArray(arr, 2);
      assert.deepEqual(arr, original);
    });

    test('既存アイテムがある場合も新しい配列を返す', () => {
      const arr = [1, 2, 3];
      const result = addToArray(arr, 2);
      assert.notEqual(result, arr);
    });
  });

  describe('オブジェクト参照の比較', () => {
    test('オブジェクト参照が同じ場合は追加されない', () => {
      const obj1 = { id: 1 };
      const obj2 = { id: 2 };
      const arr = [obj1, obj2];
      const result = addToArray(arr, obj1);
      assert.deepEqual(result, [obj1, obj2]);
    });

    test('オブジェクトの値が同じでも参照が異なれば追加される', () => {
      const obj1 = { id: 1 };
      const obj2 = { id: 2 };
      const arr = [obj1, obj2];
      const newObj = { id: 1 }; // 値は同じだが参照が異なる
      const result = addToArray(arr, newObj);
      assert.deepEqual(result, [obj1, obj2, newObj]);
    });
  });
});

describe('removeFromArray', () => {
  describe('配列からの削除', () => {
    test('アイテムを削除する', () => {
      const arr = [1, 2, 3];
      const result = removeFromArray(arr, 2);
      assert.deepEqual(result, [1, 3]);
    });

    test('存在しないアイテムの削除は元と同じ内容を返す', () => {
      const arr = [1, 2, 3];
      const result = removeFromArray(arr, 4);
      assert.deepEqual(result, [1, 2, 3]);
    });

    test('複数の同じアイテムがある場合全て削除する', () => {
      const arr = [1, 2, 2, 3, 2];
      const result = removeFromArray(arr, 2);
      assert.deepEqual(result, [1, 3]);
    });

    test('空配列から削除しても空配列を返す', () => {
      const arr: number[] = [];
      const result = removeFromArray(arr, 1);
      assert.deepEqual(result, []);
    });

    test('1つのアイテムのみの配列から削除すると空配列になる', () => {
      const arr = [1];
      const result = removeFromArray(arr, 1);
      assert.deepEqual(result, []);
    });

    test('文字列配列でも動作する', () => {
      const arr = ['a', 'b', 'c'];
      assert.deepEqual(removeFromArray(arr, 'b'), ['a', 'c']);
      assert.deepEqual(removeFromArray(arr, 'd'), ['a', 'b', 'c']);
    });
  });

  describe('イミュータビリティ', () => {
    test('削除時に元の配列がミューテートされない', () => {
      const arr = [1, 2, 3];
      const original = [...arr];
      removeFromArray(arr, 2);
      assert.deepEqual(arr, original);
    });

    test('存在しないアイテム削除時も元の配列がミューテートされない', () => {
      const arr = [1, 2, 3];
      const original = [...arr];
      removeFromArray(arr, 4);
      assert.deepEqual(arr, original);
    });

    test('存在しないアイテムの場合も新しい配列を返す', () => {
      const arr = [1, 2, 3];
      const result = removeFromArray(arr, 4);
      assert.notEqual(result, arr);
    });
  });

  describe('オブジェクト参照の比較', () => {
    test('オブジェクト参照が同じ場合に削除される', () => {
      const obj1 = { id: 1 };
      const obj2 = { id: 2 };
      const obj3 = { id: 3 };
      const arr = [obj1, obj2, obj3];
      const result = removeFromArray(arr, obj2);
      assert.deepEqual(result, [obj1, obj3]);
    });

    test('オブジェクトの値が同じでも参照が異なれば削除されない', () => {
      const obj1 = { id: 1 };
      const obj2 = { id: 2 };
      const arr = [obj1, obj2];
      const newObj = { id: 1 }; // 値は同じだが参照が異なる
      const result = removeFromArray(arr, newObj);
      assert.deepEqual(result, [obj1, obj2]);
    });

    test('同じ参照のオブジェクトが複数ある場合全て削除される', () => {
      const obj1 = { id: 1 };
      const obj2 = { id: 2 };
      const arr = [obj1, obj2, obj1, obj1];
      const result = removeFromArray(arr, obj1);
      assert.deepEqual(result, [obj2]);
    });
  });
});
