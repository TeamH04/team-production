/**
 * 店舗登録フローの型定義とバリデーションロジック
 */

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
  // onChange, placeholder はUI層で管理するためここでは含めないか、
  // もしくはGenericsにするが、ここでは単純化のため省くか、UI用の型と分離する。
  // register-shop.tsx ではこれに onChange 等を含んでいるため、
  // ここでは純粋なデータ構造としての Step を定義する。
  isMultiple?: false;
  isBudgetRange?: false;
};

export type MultiValueStep = StepBase & {
  value: ItemWithId[];
  isMultiple: true;
  isBudgetRange?: false;
};

export type BudgetRangeStep = StepBase & {
  value: { min: string; max: string };
  isBudgetRange: true;
  isMultiple?: false;
};

// UIコンポーネントで使う型と互換性を持たせるため、
// 厳密には register-shop.tsx の Step 定義とは異なる部分（onChangeなど）があるが、
// バリデーションには value と設定値があれば十分。
export type StepData = SingleValueStep | MultiValueStep | BudgetRangeStep;

// UI層のStep型から、バリデーションに必要なプロパティのみを抽出した型
// onChangeやplaceholderなどのUIプロパティを除外して受け入れる
type StepLike = StepBase & {
  value: string | ItemWithId[] | { min: string; max: string };
  isMultiple?: boolean;
  isBudgetRange?: boolean;
};

export type ValidationResult = {
  isValid: boolean;
  errorMessage?: string;
  errorTitle?: string;
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
        return {
          isValid: false,
          errorTitle: '入力不足',
          errorMessage: `${step.title} は必須です`,
        };
      }
    } else if (!step.isBudgetRange && typeof step.value === 'string') {
      if (!step.value.trim()) {
        return {
          isValid: false,
          errorTitle: '入力不足',
          errorMessage: `${step.title} は必須です`,
        };
      }
    } else if (step.key === 'address' && typeof step.value === 'string') {
      // 住所の追加チェックなどがあればここに
      if (!step.value.trim()) {
        return {
          isValid: false,
          errorTitle: '入力不足',
          errorMessage: '住所は必須です',
        };
      }
    }
  }

  if (step.key === 'minutesFromStation') {
    // 必須でなくても入力があれば検証
    const value = !step.isMultiple && !step.isBudgetRange ? step.value.trim() : '';
    if (value) {
      if (!/^\d{1,3}$/.test(value)) {
        return {
          isValid: false,
          errorTitle: '入力エラー',
          errorMessage: '最寄り駅からの分数は半角数字で入力してください',
        };
      }
      if (Number(value) <= 0) {
        return {
          isValid: false,
          errorTitle: '入力エラー',
          errorMessage: '最寄り駅からの分数は1以上で入力してください',
        };
      }
    }
  }

  if (step.key === 'budget' && step.isBudgetRange) {
    const { min, max } = step.value;
    const minVal = min.trim();
    const maxVal = max.trim();

    if (minVal) {
      if (!/^\d+$/.test(minVal)) {
        return {
          isValid: false,
          errorTitle: '入力エラー',
          errorMessage: '最小値は半角数字のみで入力してください',
        };
      }
      if (Number(minVal) <= 0) {
        return {
          isValid: false,
          errorTitle: '入力エラー',
          errorMessage: '最小値は1以上で入力してください',
        };
      }
    }

    if (maxVal) {
      if (!/^\d+$/.test(maxVal)) {
        return {
          isValid: false,
          errorTitle: '入力エラー',
          errorMessage: '最大値は半角数字のみで入力してください',
        };
      }
      if (Number(maxVal) <= 0) {
        return {
          isValid: false,
          errorTitle: '最大値は1以上で入力してください', // 元コードのメッセージに合わせる
          errorMessage: '最大値は1以上で入力してください',
        };
      }
    }

    if (minVal && maxVal) {
      if (Number(minVal) > Number(maxVal)) {
        return {
          isValid: false,
          errorTitle: '入力エラー',
          errorMessage: '最小値は最大値以下で入力してください',
        };
      }
    }
  }

  return { isValid: true };
}
