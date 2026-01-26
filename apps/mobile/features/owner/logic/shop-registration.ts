/**
 * 店舗登録フローの型定義とバリデーションロジック
 * @team/validators パッケージからの再エクスポート
 */

export {
  type ItemWithId,
  type StepBase,
  type SingleValueStep,
  type MultiValueStep,
  type BudgetRangeStep,
  type AccessStep,
  type StepData,
  toStepData,
  validateStep,
} from '@team/validators';

export type { ValidationResult } from '@team/constants';
