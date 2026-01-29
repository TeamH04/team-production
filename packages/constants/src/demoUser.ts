/**
 * デモユーザー情報
 * apps/backend/migrations/000002_seed.up.sql のシードユーザーと一致
 *
 * @warning このデータは開発・テスト環境専用です。本番環境では使用しないでください。
 */
export const DEMO_USER = {
  id: '99999999-9999-9999-9999-999999999999',
  name: 'シードユーザー',
  email: 'seed@example.com',
  provider: 'seed',
  avatarUrl: null,
} as const;

export type DemoUser = typeof DEMO_USER;
