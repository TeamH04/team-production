/**
 * ユーザーロール定数
 */
export const ROLES = {
  OWNER: 'owner',
  USER: 'user',
} as const;

/**
 * ロールの型定義
 */
export type RoleType = (typeof ROLES)[keyof typeof ROLES];
