import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { validateStep, type StepData } from '../logic/shop-registration';

/**
 * StepDataを作成するファクトリ関数
 */
const createStepData = (overrides: Partial<StepData> = {}): StepData =>
  ({
    key: 'test',
    title: 'テスト',
    description: '',
    required: true,
    keyboardType: 'default',
    value: 'test value',
    ...overrides,
  }) as StepData;

/**
 * minutesFromStation用のStepDataを作成
 */
const createMinutesFromStationStep = (value: string, overrides: Partial<StepData> = {}): StepData =>
  ({
    key: 'minutesFromStation',
    title: '徒歩分数',
    description: '',
    required: false,
    keyboardType: 'number-pad',
    value,
    ...overrides,
  }) as StepData;

/**
 * budget用のStepDataを作成
 */
const createBudgetStep = (
  value: { min: string; max: string },
  overrides: Partial<StepData> = {},
): StepData =>
  ({
    key: 'budget',
    title: '予算',
    description: '',
    required: false,
    keyboardType: 'number-pad',
    isBudgetRange: true,
    value,
    ...overrides,
  }) as StepData;

describe('validateStep', () => {
  describe('必須チェック', () => {
    describe('単一値', () => {
      test('値があれば有効', () => {
        const step = createStepData({ value: 'some value' });
        const result = validateStep(step);
        assert.equal(result.isValid, true);
      });

      test('空文字ならエラー', () => {
        const step = createStepData({ value: '   ' });
        const result = validateStep(step);
        assert.equal(result.isValid, false);
        assert.match(result.errorMessage!, /テスト は必須です/);
      });

      test('必須でない場合は空文字でも有効', () => {
        const step = createStepData({ value: '', required: false });
        const result = validateStep(step);
        assert.equal(result.isValid, true);
      });
    });

    describe('複数値', () => {
      test('1つでも入力があれば有効', () => {
        const step = createStepData({
          key: 'tags',
          title: 'タグ',
          isMultiple: true,
          value: [
            { id: '1', value: '' },
            { id: '2', value: 'tag' },
          ],
        });
        const result = validateStep(step);
        assert.equal(result.isValid, true);
      });

      test('すべて空ならエラー', () => {
        const step = createStepData({
          key: 'tags',
          title: 'タグ',
          isMultiple: true,
          value: [
            { id: '1', value: '' },
            { id: '2', value: '  ' },
          ],
        });
        const result = validateStep(step);
        assert.equal(result.isValid, false);
        assert.match(result.errorMessage!, /タグ は必須です/);
      });

      test('空配列はエラー', () => {
        const step = createStepData({
          key: 'tags',
          title: 'タグ',
          isMultiple: true,
          value: [],
        });
        const result = validateStep(step);
        assert.equal(result.isValid, false);
      });
    });
  });

  describe('徒歩分数バリデーション', () => {
    test('空文字は有効（必須ではない場合）', () => {
      const result = validateStep(createMinutesFromStationStep(''));
      assert.equal(result.isValid, true);
    });

    test('半角数字は有効', () => {
      const result = validateStep(createMinutesFromStationStep('10'));
      assert.equal(result.isValid, true);
    });

    test('1は有効（最小値）', () => {
      const result = validateStep(createMinutesFromStationStep('1'));
      assert.equal(result.isValid, true);
    });

    test('999は有効（3桁最大値）', () => {
      const result = validateStep(createMinutesFromStationStep('999'));
      assert.equal(result.isValid, true);
    });

    test('全角数字はエラー', () => {
      const result = validateStep(createMinutesFromStationStep('１０'));
      assert.equal(result.isValid, false);
      assert.match(result.errorMessage!, /半角数字/);
    });

    test('0はエラー', () => {
      const result = validateStep(createMinutesFromStationStep('0'));
      assert.equal(result.isValid, false);
      assert.match(result.errorMessage!, /1以上/);
    });

    test('負の数はエラー', () => {
      const result = validateStep(createMinutesFromStationStep('-5'));
      assert.equal(result.isValid, false);
    });

    test('文字を含むとエラー', () => {
      const result = validateStep(createMinutesFromStationStep('10分'));
      assert.equal(result.isValid, false);
    });

    test('小数はエラー', () => {
      const result = validateStep(createMinutesFromStationStep('5.5'));
      assert.equal(result.isValid, false);
    });
  });

  describe('予算バリデーション', () => {
    test('両方空は有効', () => {
      const result = validateStep(createBudgetStep({ min: '', max: '' }));
      assert.equal(result.isValid, true);
    });

    test('正常な範囲は有効', () => {
      const result = validateStep(createBudgetStep({ min: '1000', max: '2000' }));
      assert.equal(result.isValid, true);
    });

    test('最小値のみ入力は有効', () => {
      const result = validateStep(createBudgetStep({ min: '1000', max: '' }));
      assert.equal(result.isValid, true);
    });

    test('最大値のみ入力は有効', () => {
      const result = validateStep(createBudgetStep({ min: '', max: '2000' }));
      assert.equal(result.isValid, true);
    });

    test('最小値=最大値は有効', () => {
      const result = validateStep(createBudgetStep({ min: '1000', max: '1000' }));
      assert.equal(result.isValid, true);
    });

    test('最小値が非数値ならエラー', () => {
      const result = validateStep(createBudgetStep({ min: 'abc', max: '' }));
      assert.equal(result.isValid, false);
      assert.match(result.errorMessage!, /半角数字/);
    });

    test('最大値が非数値ならエラー', () => {
      const result = validateStep(createBudgetStep({ min: '', max: 'abc' }));
      assert.equal(result.isValid, false);
      assert.match(result.errorMessage!, /半角数字/);
    });

    test('最小値 > 最大値ならエラー', () => {
      const result = validateStep(createBudgetStep({ min: '3000', max: '2000' }));
      assert.equal(result.isValid, false);
      assert.match(result.errorMessage!, /最小値は最大値以下/);
    });

    test('0円はエラー（1以上必須）', () => {
      const result = validateStep(createBudgetStep({ min: '0', max: '1000' }));
      assert.equal(result.isValid, false);
    });

    test('大きな数値（10桁）は有効', () => {
      const result = validateStep(createBudgetStep({ min: '1000000000', max: '9999999999' }));
      assert.equal(result.isValid, true);
    });

    test('全角数字はエラー', () => {
      const result = validateStep(createBudgetStep({ min: '１０００', max: '' }));
      assert.equal(result.isValid, false);
    });
  });

  describe('address（住所）バリデーション', () => {
    test('値があれば有効', () => {
      const step = createStepData({
        key: 'address',
        title: '住所',
        value: '東京都渋谷区',
      });
      const result = validateStep(step);
      assert.equal(result.isValid, true);
    });

    test('必須で空文字ならエラー', () => {
      const step = createStepData({
        key: 'address',
        title: '住所',
        required: true,
        value: '   ',
      });
      const result = validateStep(step);
      assert.equal(result.isValid, false);
    });

    test('必須でない場合は空文字でも有効', () => {
      const step = createStepData({
        key: 'address',
        title: '住所',
        required: false,
        value: '',
      });
      const result = validateStep(step);
      assert.equal(result.isValid, true);
    });
  });
});
