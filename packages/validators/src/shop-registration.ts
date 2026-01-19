/**
 * 店舗登録フローの型定義とバリデーションロジック
 */

import {
  VALIDATION_MESSAGES,
  VALIDATION_SUCCESS,
  createValidationError,
  validatePositiveInteger,
  type ValidationResult,
} from '@team/constants';

export type ItemWithId = { id: string; value: string };

export type StepBase = {
  key: string;
  title: string;
  description: string;
  required: boolean;
  keyboardType: 'default' | 'number-pad';
};

export type SingleValueStep = StepBase & {
  value: string;
  isMultiple?: false;
  isBudgetRange?: false;
  isAccess?: false;
};

export type MultiValueStep = StepBase & {
  value: ItemWithId[];
  isMultiple: true;
  isBudgetRange?: false;
  isAccess?: false;
};

export type BudgetRangeStep = StepBase & {
  value: { min: string; max: string };
  isBudgetRange: true;
  isMultiple?: false;
  isAccess?: false;
};

export type AccessStep = StepBase & {
  value: { station: string; minutes: string };
  isAccess: true;
  isMultiple?: false;
  isBudgetRange?: false;
};

// UIコンポーネントで使う型と互換性を持たせるため、
// 厳密には register-shop.tsx の Step 定義とは異なる部分（onChangeなど）があるが、
// バリデーションには value と設定値があれば十分。
export type StepData = SingleValueStep | MultiValueStep | BudgetRangeStep | AccessStep;

// UI層のStep型から、バリデーションに必要なプロパティのみを抽出した型
// onChangeやplaceholderなどのUIプロパティを除外して受け入れる
type StepLike = StepBase & {
  value:
    | string
    | ItemWithId[]
    | { min: string; max: string }
    | { station: string; minutes: string };
  isMultiple?: boolean;
  isBudgetRange?: boolean;
  isAccess?: boolean;
};

/**
 * UI層のStep型からバリデーション用のStepDataを抽出する
 */
export function toStepData(step: StepLike): StepData {
  if (step.isMultiple) {
    return step as MultiValueStep;
  }
  if (step.isBudgetRange) {
    return step as BudgetRangeStep;
  }
  if (step.isAccess) {
    return step as AccessStep;
  }
  return step as SingleValueStep;
}

/**
 * ステップごとの入力値を検証する
 */
export function validateStep(step: StepData): ValidationResult {
  if (step.required) {
    if (step.isMultiple) {
      const hasValue = step.value.some(v => v.value.trim().length > 0);
      if (!hasValue) {
        return createValidationError(
          VALIDATION_MESSAGES.INPUT_MISSING_TITLE,
          `${step.title} ${VALIDATION_MESSAGES.REQUIRED_SUFFIX}`,
        );
      }
    } else if (step.isAccess) {
      // station check
      if (!step.value.station.trim()) {
        return createValidationError(
          VALIDATION_MESSAGES.INPUT_MISSING_TITLE,
          `最寄り駅${VALIDATION_MESSAGES.REQUIRED_SUFFIX}`,
        );
      }
    } else if (step.isBudgetRange) {
      // budget range is usually not required as a whole, but if it were:
      if (!step.value.min.trim() && !step.value.max.trim()) {
        return createValidationError(
          VALIDATION_MESSAGES.INPUT_MISSING_TITLE,
          `${step.title} ${VALIDATION_MESSAGES.REQUIRED_SUFFIX}`,
        );
      }
    } else {
      // SingleValueStep
      if (!step.value.trim()) {
        return createValidationError(
          VALIDATION_MESSAGES.INPUT_MISSING_TITLE,
          `${step.title} ${VALIDATION_MESSAGES.REQUIRED_SUFFIX}`,
        );
      }
    }
  }

  // key based extra validations
  if (step.key === 'minutesFromStation' && !step.isMultiple && !step.isBudgetRange && !step.isAccess) {
    const result = validatePositiveInteger(step.value.trim() || undefined, '最寄り駅からの分数', 3);
    if (!result.isValid) {
      return result;
    }
  }

  if (step.isAccess) {
    // minutes check
    const { minutes } = step.value;
    const result = validatePositiveInteger(minutes.trim() || undefined, '最寄り駅からの分数', 3);
    if (!result.isValid) {
      return result;
    }
  }

  if (step.isBudgetRange) {
    const { min, max } = step.value;
    const minVal = min.trim();
    const maxVal = max.trim();

    const minResult = validatePositiveInteger(minVal || undefined, '最小値', 10);
    if (!minResult.isValid) {
      return minResult;
    }

    const maxResult = validatePositiveInteger(maxVal || undefined, '最大値', 10);
    if (!maxResult.isValid) {
      return maxResult;
    }

    if (minVal && maxVal) {
      if (Number(minVal) > Number(maxVal)) {
        return createValidationError(
          VALIDATION_MESSAGES.INPUT_ERROR_TITLE,
          '最小値は最大値以下で入力してください',
        );
      }
    }
  }

  return VALIDATION_SUCCESS;
}