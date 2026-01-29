import { ERROR_MESSAGES } from './messages';

/**
 * 認証エラーに関するメッセージ定数
 */
export const AUTH_ERROR_MESSAGES = {
  /** 認証エラーダイアログのタイトル */
  AUTH_ERROR_TITLE: '認証エラー',
  /** ログインが必要なアクションのダイアログタイトル */
  LOGIN_REQUIRED_TITLE: ERROR_MESSAGES.AUTH_REQUIRED,
  /** いいね操作時の認証エラーメッセージ */
  LIKE: 'いいねにはログインが必要です。',
  /** レビュー投稿時の認証エラーメッセージ */
  REVIEW: 'レビュー投稿にはログインが必要です。',
  /** お気に入り登録時の認証エラーメッセージ */
  FAVORITE: 'お気に入り登録にはログインが必要です。',
  /** 汎用的な認証エラーメッセージ */
  GENERIC: 'この操作にはログインが必要です。',
} as const;

/** AUTH_ERROR_MESSAGES のキーの型 */
export type AuthErrorMessageKey = keyof typeof AUTH_ERROR_MESSAGES;
