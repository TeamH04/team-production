import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { validateStep, type StepData } from '../shop-registration';

describe('validateStep', () => {
  describe('必須チェック', () => {
    test('単一値: 値があればOK', () => {
      const step: StepData = {
        key: 'test',
        title: 'テスト',
        description: '',
        required: true,
        keyboardType: 'default',
        value: 'some value',
      };
      const result = validateStep(step);
      assert.equal(result.isValid, true);
    });

    test('単一値: 空文字ならエラー', () => {
      const step: StepData = {
        key: 'test',
        title: 'テスト',
        description: '',
        required: true,
        keyboardType: 'default',
        value: '   ',
      };
      const result = validateStep(step);
      assert.equal(result.isValid, false);
      assert.match(result.errorMessage!, /テスト は必須です/);
    });

    test('複数値: 1つでも入力があればOK', () => {
      const step: StepData = {
        key: 'tags',
        title: 'タグ',
        description: '',
        required: true,
        keyboardType: 'default',
        isMultiple: true,
        value: [
          { id: '1', value: '' },
          { id: '2', value: 'tag' },
        ],
      };
      const result = validateStep(step);
      assert.equal(result.isValid, true);
    });

    test('複数値: すべて空ならエラー', () => {
      const step: StepData = {
        key: 'tags',
        title: 'タグ',
        description: '',
        required: true,
        keyboardType: 'default',
        isMultiple: true,
        value: [
          { id: '1', value: '' },
          { id: '2', value: '  ' },
        ],
      };
      const result = validateStep(step);
      assert.equal(result.isValid, false);
      assert.match(result.errorMessage!, /タグ は必須です/);
    });
  });

  describe('minutesFromStation (徒歩分数)', () => {
    const baseStep: StepData = {
      key: 'minutesFromStation',
      title: '徒歩分数',
      description: '',
      required: false,
      keyboardType: 'number-pad',
      value: '',
    };

    test('空文字ならOK (必須ではない場合)', () => {
      const result = validateStep({ ...baseStep, value: '' });
      assert.equal(result.isValid, true);
    });

    test('半角数字ならOK', () => {
      const result = validateStep({ ...baseStep, value: '10' });
      assert.equal(result.isValid, true);
    });

    test('全角数字や文字が含まれるとエラー', () => {
      const result = validateStep({ ...baseStep, value: '１０' });
      assert.equal(result.isValid, false);
      assert.match(result.errorMessage!, /半角数字/);
    });

    test('0以下の数字ならエラー', () => {
      const result = validateStep({ ...baseStep, value: '0' });
      assert.equal(result.isValid, false);
      assert.match(result.errorMessage!, /1以上/);
    });
  });

  describe('budget (予算)', () => {
    const baseStep: StepData = {
      key: 'budget',
      title: '予算',
      description: '',
      required: false,
      keyboardType: 'number-pad',
      isBudgetRange: true,
      value: { min: '', max: '' },
    };

    test('空ならOK', () => {
      const result = validateStep({ ...baseStep });
      assert.equal(result.isValid, true);
    });

    test('正常な範囲', () => {
      const result = validateStep({ ...baseStep, value: { min: '1000', max: '2000' } });
      assert.equal(result.isValid, true);
    });

    test('最小値のみ入力もOK', () => {
      const result = validateStep({ ...baseStep, value: { min: '1000', max: '' } });
      assert.equal(result.isValid, true);
    });

    test('最大値のみ入力もOK', () => {
      const result = validateStep({ ...baseStep, value: { min: '', max: '2000' } });
      assert.equal(result.isValid, true);
    });

    test('最小値が非数値ならエラー', () => {
      const result = validateStep({ ...baseStep, value: { min: 'abc', max: '' } });
      assert.equal(result.isValid, false);
      assert.match(result.errorMessage!, /半角数字/);
    });

    test('最大値が非数値ならエラー', () => {
      const result = validateStep({ ...baseStep, value: { min: '', max: 'abc' } });
      assert.equal(result.isValid, false);
      assert.match(result.errorMessage!, /半角数字/);
    });

    test('最小値 > 最大値ならエラー', () => {
      const result = validateStep({ ...baseStep, value: { min: '3000', max: '2000' } });
      assert.equal(result.isValid, false);
      assert.match(result.errorMessage!, /最小値は最大値以下/);
    });
  });
});
