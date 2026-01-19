import { VALIDATION_MESSAGES } from './messages';

export interface ValidationResult {
  isValid: boolean;
  errorTitle?: string;
  errorMessage?: string;
}

export const VALIDATION_SUCCESS: ValidationResult = { isValid: true };

export function createValidationError(title: string, message: string): ValidationResult {
  return { isValid: false, errorTitle: title, errorMessage: message };
}

export function validatePositiveInteger(
  value: string | undefined,
  fieldName: string,
  maxDigits = 3,
): ValidationResult {
  if (!value) {
    return VALIDATION_SUCCESS; // Empty is valid (optional field)
  }

  const pattern = new RegExp(`^\\d{1,${maxDigits}}$`);
  if (!pattern.test(value)) {
    return createValidationError(
      VALIDATION_MESSAGES.INPUT_ERROR_TITLE,
      `${fieldName}は${maxDigits}桁以内の半角数字で入力してください`,
    );
  }

  if (Number(value) <= 0) {
    return createValidationError(
      VALIDATION_MESSAGES.INPUT_ERROR_TITLE,
      `${fieldName}は1以上で入力してください`,
    );
  }

  return VALIDATION_SUCCESS;
}

export function validateRange(
  value: string | undefined,
  fieldName: string,
  min: number,
  max: number,
): ValidationResult {
  if (!value) {
    return VALIDATION_SUCCESS;
  }

  const num = Number(value);
  if (isNaN(num) || num < min || num > max) {
    return createValidationError(
      VALIDATION_MESSAGES.INPUT_ERROR_TITLE,
      `${fieldName}は${min}から${max}の範囲で入力してください`,
    );
  }

  return VALIDATION_SUCCESS;
}

// =============================================================================
// Email Validation
// =============================================================================

// ReDoS対策: シンプルなパターンでバックトラッキングを防止
export const EMAIL_VALIDATION_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_VALIDATION_REGEX.test(email);
}

// =============================================================================
// Date Validation
// =============================================================================

/**
 * 日付入力をYYYY-MM-DD形式にフォーマットする関数
 * 数字のみを抽出し、適切な位置にハイフンを挿入する
 */
export function formatDateInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  const y = digits.slice(0, 4);
  const m = digits.slice(4, 6);
  const d = digits.slice(6, 8);

  if (digits.length <= 4) return y + (digits.length === 4 ? '-' : '');
  if (digits.length <= 6) return `${y}-${m}` + (digits.length === 6 ? '-' : '');
  return `${y}-${m}-${d}`;
}

/**
 * 8桁の日付文字列が有効かチェックする関数
 * @param digits8 - 8桁の数字文字列（例: "20240115"）
 * @returns 有効な日付の場合true
 */
export function isValidDateYYYYMMDD(digits8: string): boolean {
  if (!/^\d{8}$/.test(digits8)) return false;
  const y = Number(digits8.slice(0, 4));
  const m = Number(digits8.slice(4, 6));
  const d = Number(digits8.slice(6, 8));

  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

// =============================================================================
// Password Validation
// =============================================================================

export const PASSWORD_MIN_LENGTH = 8;

export function validatePassword(
  password: string | undefined,
  minLength = PASSWORD_MIN_LENGTH,
): ValidationResult {
  if (!password) {
    return VALIDATION_SUCCESS;
  }
  if (password.length < minLength) {
    return createValidationError(
      VALIDATION_MESSAGES.INPUT_ERROR_TITLE,
      `パスワードは${minLength}文字以上で入力してください`,
    );
  }
  return VALIDATION_SUCCESS;
}

// =============================================================================
// Required String Validation
// =============================================================================

export function validateRequiredString(
  value: string | undefined,
  fieldName: string,
): ValidationResult {
  if (!value || !value.trim()) {
    return createValidationError(VALIDATION_MESSAGES.INPUT_MISSING_TITLE, `${fieldName}は必須です`);
  }
  return VALIDATION_SUCCESS;
}
