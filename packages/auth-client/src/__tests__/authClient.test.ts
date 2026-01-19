import assert from 'node:assert/strict';
import { describe, test, mock } from 'node:test';

import { SESSION_NOT_FOUND } from '@team/constants';

import { createAuthClient, type AuthClientConfig } from '../authClient';

/**
 * auth メソッドのオーバーライド型
 */
type MockAuthOverrides = {
  getUser?: () => Promise<{ data: { user: unknown }; error: Error | null }>;
  getSession?: () => Promise<{ data: { session: unknown }; error: Error | null }>;
  signOut?: () => Promise<{ error: Error | null }>;
};

/**
 * テスト用の AuthClientConfig を生成するファクトリヘルパー
 *
 * @param overrides - デフォルト値をオーバーライドするオプション
 * @returns AuthClientConfig オブジェクト
 */
function createMockConfig(
  overrides: {
    auth?: MockAuthOverrides;
    isSupabaseConfigured?: boolean;
    fetchAuthMe?: (token: string) => Promise<unknown>;
  } = {},
): AuthClientConfig {
  return {
    getSupabase: () =>
      ({
        auth: {
          getUser: overrides.auth?.getUser ?? (async () => ({ data: { user: null }, error: null })),
          getSession:
            overrides.auth?.getSession ?? (async () => ({ data: { session: null }, error: null })),
          signOut: overrides.auth?.signOut ?? (async () => ({ error: null })),
        },
      }) as unknown as ReturnType<AuthClientConfig['getSupabase']>,
    isSupabaseConfigured: () => overrides.isSupabaseConfigured ?? false,
    fetchAuthMe: overrides.fetchAuthMe,
  };
}

describe('createAuthClient', () => {
  describe('ファクトリ関数', () => {
    test('正しいオブジェクトを返す', () => {
      const mockConfig = createMockConfig();

      const authClient = createAuthClient(mockConfig);

      assert.equal(typeof authClient.getCurrentUser, 'function');
      assert.equal(typeof authClient.getAccessToken, 'function');
      assert.equal(typeof authClient.checkIsOwner, 'function');
      assert.equal(typeof authClient.ensureUserExistsInDB, 'function');
      assert.equal(typeof authClient.resolveAuth, 'function');
      assert.equal(typeof authClient.hasOwnerRole, 'function');
      assert.equal(typeof authClient.isSupabaseConfigured, 'function');
      assert.equal(typeof authClient.getSupabase, 'function');
    });
  });

  describe('getCurrentUser', () => {
    test('getUser がエラーを返した場合は null を返す', async () => {
      const mockConfig = createMockConfig({
        auth: {
          getUser: async () => ({
            data: { user: null },
            error: new Error('Auth error'),
          }),
        },
        isSupabaseConfigured: true,
      });

      const authClient = createAuthClient(mockConfig);
      const result = await authClient.getCurrentUser();

      assert.equal(result, null);
    });

    test('getUser が例外をスローした場合は null を返す', async () => {
      const mockConfig = createMockConfig({
        auth: {
          getUser: async () => {
            throw new Error('Network error');
          },
        },
        isSupabaseConfigured: true,
      });

      const authClient = createAuthClient(mockConfig);
      const result = await authClient.getCurrentUser();

      assert.equal(result, null);
    });
  });

  describe('getAccessToken', () => {
    test('getSession がエラーを返した場合は null を返す', async () => {
      const mockConfig = createMockConfig({
        auth: {
          getSession: async () => ({
            data: { session: null },
            error: new Error('Session error'),
          }),
        },
        isSupabaseConfigured: true,
      });

      const authClient = createAuthClient(mockConfig);
      const result = await authClient.getAccessToken();

      assert.equal(result, null);
    });

    test('getSession が例外をスローした場合は null を返す', async () => {
      const mockConfig = createMockConfig({
        auth: {
          getSession: async () => {
            throw new Error('Network error');
          },
        },
        isSupabaseConfigured: true,
      });

      const authClient = createAuthClient(mockConfig);
      const result = await authClient.getAccessToken();

      assert.equal(result, null);
    });
  });

  describe('ensureUserExistsInDB', () => {
    test('トークンがない場合は SESSION_NOT_FOUND エラーをスローする', async () => {
      const mockConfig = createMockConfig({
        auth: {
          getSession: async () => ({
            data: { session: null },
            error: null,
          }),
        },
        isSupabaseConfigured: true,
        fetchAuthMe: async () => ({}),
      });

      const authClient = createAuthClient(mockConfig);

      await assert.rejects(
        () => authClient.ensureUserExistsInDB(),
        (err: Error) => {
          assert.equal(err.message, SESSION_NOT_FOUND);
          return true;
        },
      );
    });

    test('fetchAuthMe が失敗した場合は signOut を呼んでエラーを再スローする', async () => {
      const signOutMock = mock.fn(async () => ({ error: null }));
      const fetchError = new Error('API error');

      const mockConfig = createMockConfig({
        auth: {
          getSession: async () => ({
            data: { session: { access_token: 'test-token' } },
            error: null,
          }),
          signOut: signOutMock,
        },
        isSupabaseConfigured: true,
        fetchAuthMe: async () => {
          throw fetchError;
        },
      });

      const authClient = createAuthClient(mockConfig);

      await assert.rejects(
        () => authClient.ensureUserExistsInDB(),
        (err: Error) => {
          assert.equal(err, fetchError);
          return true;
        },
      );

      assert.equal(signOutMock.mock.callCount(), 1);
    });
  });

  describe('resolveAuth', () => {
    test('Supabase未設定時は local を返す', async () => {
      const mockConfig = createMockConfig();

      const authClient = createAuthClient(mockConfig);
      const result = await authClient.resolveAuth();

      assert.deepEqual(result, { mode: 'local' });
    });

    test('ユーザーがnullの場合は unauthenticated を返す', async () => {
      const mockConfig = createMockConfig({
        auth: {
          getUser: async () => ({
            data: { user: null },
            error: null,
          }),
        },
        isSupabaseConfigured: true,
      });

      const authClient = createAuthClient(mockConfig);
      const result = await authClient.resolveAuth();

      assert.deepEqual(result, { mode: 'unauthenticated' });
    });

    test('ユーザーはいるがトークンがnullの場合は unauthenticated を返す', async () => {
      const mockConfig = createMockConfig({
        auth: {
          getUser: async () => ({
            data: { user: { id: 'user-1' } },
            error: null,
          }),
          getSession: async () => ({
            data: { session: null },
            error: null,
          }),
        },
        isSupabaseConfigured: true,
      });

      const authClient = createAuthClient(mockConfig);
      const result = await authClient.resolveAuth();

      assert.deepEqual(result, { mode: 'unauthenticated' });
    });

    test('ユーザーもトークンもある場合は remote を返す', async () => {
      const mockConfig = createMockConfig({
        auth: {
          getUser: async () => ({
            data: { user: { id: 'user-1' } },
            error: null,
          }),
          getSession: async () => ({
            data: { session: { access_token: 'test-token' } },
            error: null,
          }),
        },
        isSupabaseConfigured: true,
      });

      const authClient = createAuthClient(mockConfig);
      const result = await authClient.resolveAuth();

      assert.deepEqual(result, { mode: 'remote', token: 'test-token' });
    });
  });

  describe('isSupabaseConfigured', () => {
    test('設定された関数の呼び出し回数を検証する', () => {
      const isSupabaseConfiguredMock = mock.fn(() => true);
      const baseConfig = createMockConfig();
      const mockConfig: AuthClientConfig = {
        ...baseConfig,
        isSupabaseConfigured: isSupabaseConfiguredMock,
      };

      const authClient = createAuthClient(mockConfig);

      assert.equal(isSupabaseConfiguredMock.mock.callCount(), 0);

      authClient.isSupabaseConfigured();
      assert.equal(isSupabaseConfiguredMock.mock.callCount(), 1);

      authClient.isSupabaseConfigured();
      assert.equal(isSupabaseConfiguredMock.mock.callCount(), 2);
    });
  });

  describe('hasOwnerRole', () => {
    test('nullユーザーに対してfalseを返す', () => {
      const mockConfig = createMockConfig();

      const authClient = createAuthClient(mockConfig);

      assert.equal(authClient.hasOwnerRole(null), false);
    });
  });
});
