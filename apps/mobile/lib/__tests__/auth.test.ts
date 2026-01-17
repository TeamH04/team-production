import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { isOwnerFromUser } from '../auth';

import type { User } from '@supabase/supabase-js';

/**
 * isOwnerFromUser のテスト
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
describe('isOwnerFromUser', () => {
  test('user が null の場合 false を返す', () => {
    const result = isOwnerFromUser(null);
    assert.equal(result, false);
  });

  test('user_metadata.role が "owner" の場合 true を返す', () => {
    const user = {
      id: 'user-1',
      user_metadata: { role: 'owner' },
      app_metadata: {},
    } as unknown as User;

    const result = isOwnerFromUser(user);
    assert.equal(result, true);
  });

  test('app_metadata.roles に "owner" が含まれる場合 true を返す', () => {
    const user = {
      id: 'user-1',
      user_metadata: {},
      app_metadata: { roles: ['admin', 'owner'] },
    } as unknown as User;

    const result = isOwnerFromUser(user);
    assert.equal(result, true);
  });

  test('app_metadata.role が "owner" の場合 true を返す', () => {
    const user = {
      id: 'user-1',
      user_metadata: {},
      app_metadata: { role: 'owner' },
    } as unknown as User;

    const result = isOwnerFromUser(user);
    assert.equal(result, true);
  });

  test('どのメタデータにも owner がない場合 false を返す', () => {
    const user = {
      id: 'user-1',
      user_metadata: { role: 'user' },
      app_metadata: { roles: ['admin'] },
    } as unknown as User;

    const result = isOwnerFromUser(user);
    assert.equal(result, false);
  });

  test('メタデータが空の場合 false を返す', () => {
    const user = {
      id: 'user-1',
      user_metadata: {},
      app_metadata: {},
    } as unknown as User;

    const result = isOwnerFromUser(user);
    assert.equal(result, false);
  });

  test('メタデータが undefined の場合 false を返す', () => {
    const user = {
      id: 'user-1',
    } as unknown as User;

    const result = isOwnerFromUser(user);
    assert.equal(result, false);
  });

  // 型安全性テスト: APIから予期しない型のデータが来た場合のエッジケース
  // Supabaseのメタデータは any 型なので、ランタイムでの型チェックが必要
  test('role が文字列以外の場合無視される（型安全性）', () => {
    const user = {
      id: 'user-1',
      user_metadata: { role: 123 },
      app_metadata: { role: ['owner'] },
    } as unknown as User;

    const result = isOwnerFromUser(user);
    assert.equal(result, false);
  });

  test('roles が配列以外の場合無視される（型安全性）', () => {
    const user = {
      id: 'user-1',
      user_metadata: {},
      app_metadata: { roles: 'owner' },
    } as unknown as User;

    const result = isOwnerFromUser(user);
    assert.equal(result, false);
  });
});
