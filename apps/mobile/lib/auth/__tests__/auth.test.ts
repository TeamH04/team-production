import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { hasOwnerRole } from '..';

import type { User } from '@supabase/supabase-js';

/**
 * モックUserを作成するファクトリ関数
 * Supabaseの User 型に必要な最小限のプロパティを提供
 */
const createMockSupabaseUser = (
  overrides: {
    id?: string;
    user_metadata?: Record<string, unknown>;
    app_metadata?: Record<string, unknown>;
  } = {},
): User => {
  return {
    id: overrides.id ?? 'user-1',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'test@example.com',
    email_confirmed_at: '2026-01-01T00:00:00.000Z',
    phone: '',
    confirmed_at: '2026-01-01T00:00:00.000Z',
    last_sign_in_at: '2026-01-01T00:00:00.000Z',
    app_metadata: overrides.app_metadata ?? {},
    user_metadata: overrides.user_metadata ?? {},
    identities: [],
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  };
};

/**
 * hasOwnerRole のテスト
 *
 * 仕様根拠:
 * Supabaseの認証システムでは、ユーザーのrole情報が複数の場所に格納される可能性がある:
 * 1. user_metadata.role - サインアップ時に設定されるユーザー定義メタデータ
 * 2. app_metadata.role - サーバーサイドで設定されるアプリケーションメタデータ（単一値）
 * 3. app_metadata.roles - 複数ロールを持つ場合の配列形式
 *
 * この関数は以下の優先順位でオーナー判定を行う:
 * user_metadata.role → app_metadata.roles（配列） → app_metadata.role
 * これは既存データの互換性と、新旧両方のロール設定方式に対応するため
 */
describe('hasOwnerRole', () => {
  describe('nullまたは不正な入力', () => {
    test('userがnullの場合falseを返す', () => {
      const result = hasOwnerRole(null);
      assert.equal(result, false);
    });

    test('userがundefinedの場合falseを返す', () => {
      const result = hasOwnerRole(undefined as unknown as User | null);
      assert.equal(result, false);
    });
  });

  describe('user_metadata.role', () => {
    test('user_metadata.roleが"owner"の場合trueを返す', () => {
      const user = createMockSupabaseUser({
        user_metadata: { role: 'owner' },
      });

      const result = hasOwnerRole(user);
      assert.equal(result, true);
    });

    test('user_metadata.roleが"user"の場合falseを返す', () => {
      const user = createMockSupabaseUser({
        user_metadata: { role: 'user' },
      });

      const result = hasOwnerRole(user);
      assert.equal(result, false);
    });
  });

  describe('app_metadata.roles（配列）', () => {
    test('app_metadata.rolesに"owner"が含まれる場合trueを返す', () => {
      const user = createMockSupabaseUser({
        app_metadata: { roles: ['admin', 'owner'] },
      });

      const result = hasOwnerRole(user);
      assert.equal(result, true);
    });

    test('app_metadata.rolesに"owner"が含まれない場合falseを返す', () => {
      const user = createMockSupabaseUser({
        app_metadata: { roles: ['admin', 'user'] },
      });

      const result = hasOwnerRole(user);
      assert.equal(result, false);
    });

    test('app_metadata.rolesが空配列の場合falseを返す', () => {
      const user = createMockSupabaseUser({
        app_metadata: { roles: [] },
      });

      const result = hasOwnerRole(user);
      assert.equal(result, false);
    });
  });

  describe('app_metadata.role（単一値）', () => {
    test('app_metadata.roleが"owner"の場合trueを返す', () => {
      const user = createMockSupabaseUser({
        app_metadata: { role: 'owner' },
      });

      const result = hasOwnerRole(user);
      assert.equal(result, true);
    });

    test('app_metadata.roleが"user"の場合falseを返す', () => {
      const user = createMockSupabaseUser({
        app_metadata: { role: 'user' },
      });

      const result = hasOwnerRole(user);
      assert.equal(result, false);
    });
  });

  describe('メタデータなし', () => {
    test('どのメタデータにもownerがない場合falseを返す', () => {
      const user = createMockSupabaseUser({
        user_metadata: { role: 'user' },
        app_metadata: { roles: ['admin'] },
      });

      const result = hasOwnerRole(user);
      assert.equal(result, false);
    });

    test('メタデータが空の場合falseを返す', () => {
      const user = createMockSupabaseUser({
        user_metadata: {},
        app_metadata: {},
      });

      const result = hasOwnerRole(user);
      assert.equal(result, false);
    });

    test('メタデータがundefinedの場合falseを返す', () => {
      const user = {
        id: 'user-1',
      } as unknown as User;

      const result = hasOwnerRole(user);
      assert.equal(result, false);
    });
  });

  describe('型安全性', () => {
    test('roleが文字列以外の場合無視される', () => {
      const user = {
        ...createMockSupabaseUser(),
        user_metadata: { role: 123 },
        app_metadata: { role: ['owner'] },
      } as unknown as User;

      const result = hasOwnerRole(user);
      assert.equal(result, false);
    });

    test('rolesが配列以外の場合無視される', () => {
      const user = {
        ...createMockSupabaseUser(),
        user_metadata: {},
        app_metadata: { roles: 'owner' },
      } as unknown as User;

      const result = hasOwnerRole(user);
      assert.equal(result, false);
    });

    test('rolesの要素が文字列以外を含む場合は配列全体が無効となる', () => {
      // 実装のgetStringArrayは配列内の全要素が文字列でない場合、配列全体を拒否する
      const user = {
        ...createMockSupabaseUser(),
        user_metadata: {},
        app_metadata: { roles: [123, 'owner', null] },
      } as unknown as User;

      const result = hasOwnerRole(user);
      assert.equal(result, false);
    });
  });

  describe('優先順位', () => {
    test('user_metadata.roleがapp_metadata.rolesより優先される', () => {
      const user = createMockSupabaseUser({
        user_metadata: { role: 'owner' },
        app_metadata: { roles: ['user'] },
      });

      const result = hasOwnerRole(user);
      assert.equal(result, true);
    });

    test('app_metadata.rolesがapp_metadata.roleより優先される', () => {
      const user = createMockSupabaseUser({
        user_metadata: {},
        app_metadata: { roles: ['owner'], role: 'user' },
      });

      const result = hasOwnerRole(user);
      assert.equal(result, true);
    });
  });
});
