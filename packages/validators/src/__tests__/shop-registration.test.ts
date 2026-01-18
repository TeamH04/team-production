import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  toStepData,
  validateStep,
  type SingleValueStep,
  type MultiValueStep,
  type BudgetRangeStep,
} from '../shop-registration';

// =============================================================================
// ヘルパー関数
// =============================================================================

function createSingleValueStep(overrides: Partial<SingleValueStep> = {}): SingleValueStep {
  return {
    key: 'name',
    title: '店舗名',
    description: '店舗名を入力してください',
    required: true,
    keyboardType: 'default',
    value: '',
    ...overrides,
  };
}

function createMultiValueStep(overrides: Partial<MultiValueStep> = {}): MultiValueStep {
  return {
    key: 'genres',
    title: 'ジャンル',
    description: 'ジャンルを選択してください',
    required: true,
    keyboardType: 'default',
    value: [],
    isMultiple: true,
    ...overrides,
  };
}

function createBudgetRangeStep(overrides: Partial<BudgetRangeStep> = {}): BudgetRangeStep {
  return {
    key: 'budget',
    title: '予算',
    description: '予算範囲を入力してください',
    required: false,
    keyboardType: 'number-pad',
    value: { min: '', max: '' },
    isBudgetRange: true,
    ...overrides,
  };
}

// =============================================================================
// toStepData のテスト
// =============================================================================

describe('toStepData', () => {
  describe('SingleValueStep の変換', () => {
    test('通常のステップをSingleValueStepとして返す', () => {
      const step = {
        key: 'name',
        title: '店舗名',
        description: '店舗名を入力',
        required: true,
        keyboardType: 'default' as const,
        value: 'テスト店舗',
      };

      const result = toStepData(step);

      assert.equal(result.key, 'name');
      assert.equal(result.value, 'テスト店舗');
      assert.equal(result.isMultiple, undefined);
      assert.equal(result.isBudgetRange, undefined);
    });

    test('UI層の追加プロパティを持つステップも変換できる', () => {
      const stepWithUIProps = {
        key: 'address',
        title: '住所',
        description: '住所を入力',
        required: true,
        keyboardType: 'default' as const,
        value: '東京都渋谷区',
        onChange: () => {},
        placeholder: '住所を入力してください',
      };

      const result = toStepData(stepWithUIProps);

      assert.equal(result.key, 'address');
      assert.equal(result.value, '東京都渋谷区');
    });
  });

  describe('MultiValueStep の変換', () => {
    test('isMultiple: true のステップをMultiValueStepとして返す', () => {
      const step = {
        key: 'genres',
        title: 'ジャンル',
        description: 'ジャンルを選択',
        required: true,
        keyboardType: 'default' as const,
        value: [
          { id: '1', value: '和食' },
          { id: '2', value: '洋食' },
        ],
        isMultiple: true,
      };

      const result = toStepData(step);

      assert.equal(result.isMultiple, true);
      assert.ok(Array.isArray(result.value));
      assert.equal((result.value as Array<{ id: string; value: string }>).length, 2);
    });
  });

  describe('BudgetRangeStep の変換', () => {
    test('isBudgetRange: true のステップをBudgetRangeStepとして返す', () => {
      const step = {
        key: 'budget',
        title: '予算',
        description: '予算範囲を入力',
        required: false,
        keyboardType: 'number-pad' as const,
        value: { min: '1000', max: '5000' },
        isBudgetRange: true,
      };

      const result = toStepData(step);

      assert.equal(result.isBudgetRange, true);
      assert.deepEqual(result.value, { min: '1000', max: '5000' });
    });
  });
});

// =============================================================================
// validateStep のテスト
// =============================================================================

describe('validateStep', () => {
  describe('必須フィールドのバリデーション', () => {
    test('必須フィールドが空の場合エラーを返す', () => {
      const step = createSingleValueStep({ value: '' });

      const result = validateStep(step);

      assert.equal(result.isValid, false);
      assert.equal(result.errorTitle, '入力不足');
      assert.equal(result.errorMessage, '店舗名 は必須です');
    });

    test('必須フィールドが空白のみの場合エラーを返す', () => {
      const step = createSingleValueStep({ value: '   ' });

      const result = validateStep(step);

      assert.equal(result.isValid, false);
      assert.equal(result.errorTitle, '入力不足');
    });

    test('必須フィールドに値がある場合成功を返す', () => {
      const step = createSingleValueStep({ value: 'テスト店舗' });

      const result = validateStep(step);

      assert.equal(result.isValid, true);
      assert.equal(result.errorTitle, undefined);
      assert.equal(result.errorMessage, undefined);
    });

    test('必須でないフィールドが空でも成功を返す', () => {
      const step = createSingleValueStep({ required: false, value: '' });

      const result = validateStep(step);

      assert.equal(result.isValid, true);
    });
  });

  describe('minutesFromStation のバリデーション', () => {
    test('正の整数の場合成功を返す', () => {
      const step = createSingleValueStep({
        key: 'minutesFromStation',
        title: '最寄り駅からの徒歩分数',
        required: false,
        keyboardType: 'number-pad',
        value: '5',
      });

      const result = validateStep(step);

      assert.equal(result.isValid, true);
    });

    test('0の場合エラーを返す', () => {
      const step = createSingleValueStep({
        key: 'minutesFromStation',
        title: '最寄り駅からの徒歩分数',
        required: false,
        keyboardType: 'number-pad',
        value: '0',
      });

      const result = validateStep(step);

      assert.equal(result.isValid, false);
      assert.equal(result.errorTitle, '入力エラー');
      assert.ok(result.errorMessage?.includes('1以上'));
    });

    test('負の値の場合エラーを返す', () => {
      const step = createSingleValueStep({
        key: 'minutesFromStation',
        title: '最寄り駅からの徒歩分数',
        required: false,
        keyboardType: 'number-pad',
        value: '-5',
      });

      const result = validateStep(step);

      assert.equal(result.isValid, false);
      assert.equal(result.errorTitle, '入力エラー');
    });

    test('3桁を超える値の場合エラーを返す', () => {
      const step = createSingleValueStep({
        key: 'minutesFromStation',
        title: '最寄り駅からの徒歩分数',
        required: false,
        keyboardType: 'number-pad',
        value: '1000',
      });

      const result = validateStep(step);

      assert.equal(result.isValid, false);
      assert.equal(result.errorTitle, '入力エラー');
      assert.ok(result.errorMessage?.includes('3桁以内'));
    });

    test('数字以外の文字を含む場合エラーを返す', () => {
      const step = createSingleValueStep({
        key: 'minutesFromStation',
        title: '最寄り駅からの徒歩分数',
        required: false,
        keyboardType: 'number-pad',
        value: '5分',
      });

      const result = validateStep(step);

      assert.equal(result.isValid, false);
      assert.equal(result.errorTitle, '入力エラー');
    });

    test('空の場合は成功を返す（任意フィールド）', () => {
      const step = createSingleValueStep({
        key: 'minutesFromStation',
        title: '最寄り駅からの徒歩分数',
        required: false,
        keyboardType: 'number-pad',
        value: '',
      });

      const result = validateStep(step);

      assert.equal(result.isValid, true);
    });

    test('最大3桁の正の整数は成功を返す', () => {
      const step = createSingleValueStep({
        key: 'minutesFromStation',
        title: '最寄り駅からの徒歩分数',
        required: false,
        keyboardType: 'number-pad',
        value: '999',
      });

      const result = validateStep(step);

      assert.equal(result.isValid, true);
    });
  });

  describe('budget（予算範囲）のバリデーション', () => {
    test('正常な予算範囲の場合成功を返す', () => {
      const step = createBudgetRangeStep({
        value: { min: '1000', max: '5000' },
      });

      const result = validateStep(step);

      assert.equal(result.isValid, true);
    });

    test('min > max の場合エラーを返す', () => {
      const step = createBudgetRangeStep({
        value: { min: '5000', max: '1000' },
      });

      const result = validateStep(step);

      assert.equal(result.isValid, false);
      assert.equal(result.errorTitle, '入力エラー');
      assert.ok(result.errorMessage?.includes('最小値は最大値以下'));
    });

    test('min と max が同じ値の場合成功を返す', () => {
      const step = createBudgetRangeStep({
        value: { min: '3000', max: '3000' },
      });

      const result = validateStep(step);

      assert.equal(result.isValid, true);
    });

    test('min のみ入力されている場合成功を返す', () => {
      const step = createBudgetRangeStep({
        value: { min: '1000', max: '' },
      });

      const result = validateStep(step);

      assert.equal(result.isValid, true);
    });

    test('max のみ入力されている場合成功を返す', () => {
      const step = createBudgetRangeStep({
        value: { min: '', max: '5000' },
      });

      const result = validateStep(step);

      assert.equal(result.isValid, true);
    });

    test('両方空の場合成功を返す', () => {
      const step = createBudgetRangeStep({
        value: { min: '', max: '' },
      });

      const result = validateStep(step);

      assert.equal(result.isValid, true);
    });

    test('min が0の場合エラーを返す', () => {
      const step = createBudgetRangeStep({
        value: { min: '0', max: '5000' },
      });

      const result = validateStep(step);

      assert.equal(result.isValid, false);
      assert.ok(result.errorMessage?.includes('1以上'));
    });

    test('max が0の場合エラーを返す', () => {
      const step = createBudgetRangeStep({
        value: { min: '1000', max: '0' },
      });

      const result = validateStep(step);

      assert.equal(result.isValid, false);
      assert.ok(result.errorMessage?.includes('1以上'));
    });

    test('min が負の値の場合エラーを返す', () => {
      const step = createBudgetRangeStep({
        value: { min: '-1000', max: '5000' },
      });

      const result = validateStep(step);

      assert.equal(result.isValid, false);
    });

    test('大きな予算値も許容する（10桁まで）', () => {
      const step = createBudgetRangeStep({
        value: { min: '1000000', max: '9999999999' },
      });

      const result = validateStep(step);

      assert.equal(result.isValid, true);
    });
  });

  describe('複数値ステップ（isMultiple）のバリデーション', () => {
    test('必須で値がある場合成功を返す', () => {
      const step = createMultiValueStep({
        value: [
          { id: '1', value: '和食' },
          { id: '2', value: '洋食' },
        ],
      });

      const result = validateStep(step);

      assert.equal(result.isValid, true);
    });

    test('必須で空の配列の場合エラーを返す', () => {
      const step = createMultiValueStep({
        value: [],
      });

      const result = validateStep(step);

      assert.equal(result.isValid, false);
      assert.equal(result.errorTitle, '入力不足');
      assert.equal(result.errorMessage, 'ジャンル は必須です');
    });

    test('必須で全て空文字の値を持つ配列の場合エラーを返す', () => {
      const step = createMultiValueStep({
        value: [
          { id: '1', value: '' },
          { id: '2', value: '   ' },
        ],
      });

      const result = validateStep(step);

      assert.equal(result.isValid, false);
      assert.equal(result.errorTitle, '入力不足');
    });

    test('必須で少なくとも1つ有効な値がある場合成功を返す', () => {
      const step = createMultiValueStep({
        value: [
          { id: '1', value: '' },
          { id: '2', value: '和食' },
        ],
      });

      const result = validateStep(step);

      assert.equal(result.isValid, true);
    });

    test('必須でない場合は空の配列でも成功を返す', () => {
      const step = createMultiValueStep({
        required: false,
        value: [],
      });

      const result = validateStep(step);

      assert.equal(result.isValid, true);
    });
  });

  describe('その他のケース', () => {
    test('keyboardType が number-pad でも通常のバリデーションが適用される', () => {
      const step = createSingleValueStep({
        key: 'phoneNumber',
        title: '電話番号',
        keyboardType: 'number-pad',
        value: '0312345678',
      });

      const result = validateStep(step);

      assert.equal(result.isValid, true);
    });

    test('description が異なっていてもバリデーションに影響しない', () => {
      const step = createSingleValueStep({
        description: '',
        value: 'テスト',
      });

      const result = validateStep(step);

      assert.equal(result.isValid, true);
    });
  });
});
