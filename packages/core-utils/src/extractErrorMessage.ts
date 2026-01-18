/**
 * エラーメッセージ抽出ユーティリティ
 */

/**
 * unknownエラーからメッセージを抽出する
 * @param error 任意のエラー
 * @param defaultMessage エラーメッセージを取得できない場合のデフォルトメッセージ
 * @returns エラーメッセージ
 */
export function extractErrorMessage(error: unknown, defaultMessage: string): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return defaultMessage;
}
