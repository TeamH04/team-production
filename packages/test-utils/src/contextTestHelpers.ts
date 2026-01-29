/**
 * Context テスト用の共通セットアップヘルパー
 *
 * 各Context（Favorites, Reviews, Stores等）のテストで重複している
 * 認証モード別のセットアップパターンを共通化
 */
import { TEST_DEFAULT_TOKEN } from './fixtures';
import { mock } from './mocks';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { AuthState } from '@team/core-utils';

/**
 * 認証モード
 * - 'remote': リモート認証（APIコールあり）
 * - 'local': ローカルモード（APIコールなし）
 * - 'unauthenticated': 未認証状態
 */
export type AuthMode = 'remote' | 'local' | 'unauthenticated';

// AuthState は @team/core-utils から再エクスポート
export type { AuthState };

/**
 * Context テストセットアップのオプション
 */
export interface ContextTestSetupOptions {
  /** 認証モード */
  authMode: AuthMode;
  /** リモートモード時のトークン（デフォルト: TEST_DEFAULT_TOKEN） */
  token?: string;
}

/**
 * 共通モックのインターフェース
 */
export interface BaseMocks {
  /** 認証状態解決関数 */
  resolveAuth: ReturnType<typeof createMockAuth>;
  /** Supabaseクライアント取得関数 */
  getSupabase: ReturnType<typeof createMockGetSupabase>;
  /** Supabase設定チェック関数 */
  isSupabaseConfigured: () => boolean;
}

/**
 * セットアップ結果
 */
export interface ContextTestSetupResult<TCustomMocks> {
  /** 基本モック */
  baseMocks: BaseMocks;
  /** カスタムモック */
  mocks: TCustomMocks;
  /** 認証状態 */
  authState: AuthState;
  /** トークン（remoteモードのみ） */
  token: string | null;
  /** クリーンアップ関数 */
  cleanup: () => void;
}

// ==========================================
// 基本モック作成関数
// ==========================================

/**
 * 認証状態を返すモック関数を作成
 *
 * @example
 * const resolveAuth = createMockAuth({ mode: 'remote', token: TEST_DEFAULT_TOKEN });
 */
export function createMockAuth(state: AuthState) {
  return mock.fn(async () => state);
}

/**
 * データを返すフェッチモック関数を作成
 *
 * @example
 * const fetchData = createMockFetch([{ id: '1', name: 'Test' }]);
 */
export function createMockFetch<T>(data: T) {
  return mock.fn(async () => data);
}

/**
 * 引数を受け取り、データを返すAPIコールモックを作成
 *
 * @example
 * const addItem = createMockApiCall<Item, [string, string]>((id, token) => ({
 *   id,
 *   createdAt: '2026-01-01T00:00:00.000Z',
 * }));
 */
export function createMockApiCall<T = void, TArgs extends unknown[] = unknown[]>(
  implementation?: (...args: TArgs) => T,
) {
  if (implementation) {
    return mock.fn(async (...args: TArgs) => implementation(...args));
  }
  return mock.fn(async () => undefined as T);
}

/**
 * Supabaseクライアントのスタブを作成
 */
export function createSupabaseStub(): SupabaseClient {
  return {
    auth: {
      onAuthStateChange: (callback: unknown) => {
        void callback;
        return { data: { subscription: { unsubscribe: () => undefined } } };
      },
    },
  } as unknown as SupabaseClient;
}

/**
 * Supabaseクライアント取得関数のモックを作成
 */
export function createMockGetSupabase() {
  return mock.fn(createSupabaseStub);
}

/**
 * isSupabaseConfigured関数のモックを作成
 */
export function createMockIsSupabaseConfigured(configured = false) {
  return () => configured;
}

/**
 * アクセストークン取得関数のモックを作成
 */
export function createMockGetAccessToken(token: string | null = TEST_DEFAULT_TOKEN) {
  return mock.fn(async () => token);
}

/**
 * 現在のユーザー取得関数のモックを作成
 */
export function createMockGetCurrentUser<T>(user: T | null) {
  return mock.fn(async () => user);
}

// ==========================================
// 認証モード別セットアップ
// ==========================================

/**
 * 認証モードから認証状態を生成
 */
function createAuthState(options: ContextTestSetupOptions): AuthState {
  const { authMode, token = TEST_DEFAULT_TOKEN } = options;

  switch (authMode) {
    case 'remote':
      return { mode: 'remote', token };
    case 'local':
      return { mode: 'local' };
    case 'unauthenticated':
      return { mode: 'unauthenticated' };
  }
}

/**
 * 基本モックを作成
 */
function createBaseMocks(authState: AuthState): BaseMocks {
  return {
    resolveAuth: createMockAuth(authState),
    getSupabase: createMockGetSupabase(),
    isSupabaseConfigured: createMockIsSupabaseConfigured(false),
  };
}

/**
 * Contextテスト用のセットアップを作成
 *
 * 認証モード別のモック作成パターンを共通化し、
 * カスタムモック生成関数を受け取って各Contextの依存性をセットアップする
 *
 * @param options - 認証モード設定
 * @param createCustomMocks - カスタムモックを作成する関数
 * @returns セットアップ結果（モック、トークン、クリーンアップ関数）
 *
 * @example
 * // FavoritesContext用のセットアップ
 * const setup = createContextTestSetup(
 *   { authMode: 'remote', token: 'my-token' },
 *   (baseMocks) => ({
 *     fetchUserFavorites: createMockFetch<ApiFavorite[]>([]),
 *     addFavoriteApi: createMockApiCall<ApiFavorite, [string, string]>(),
 *     removeFavoriteApi: createMockApiCall<void, [string, string]>(),
 *   })
 * );
 *
 * // 依存性を注入
 * setFavoritesDependenciesForTesting({
 *   ...setup.baseMocks,
 *   ...setup.mocks,
 * });
 *
 * // テスト後のクリーンアップ
 * setup.cleanup();
 */
export function createContextTestSetup<TCustomMocks>(
  options: ContextTestSetupOptions,
  createCustomMocks: (baseMocks: BaseMocks) => TCustomMocks,
): ContextTestSetupResult<TCustomMocks> {
  const authState = createAuthState(options);
  const baseMocks = createBaseMocks(authState);
  const customMocks = createCustomMocks(baseMocks);

  const token = options.authMode === 'remote' ? (options.token ?? TEST_DEFAULT_TOKEN) : null;

  return {
    baseMocks,
    mocks: customMocks,
    authState,
    token,
    cleanup: () => {
      mock.restoreAll();
    },
  };
}

// ==========================================
// 便利なプリセットセットアップ関数
// ==========================================

/**
 * リモート認証モードのセットアップを作成
 *
 * @example
 * const setup = createRemoteSetup(
 *   'my-token',
 *   (baseMocks) => ({ fetchData: createMockFetch([]) })
 * );
 */
export function createRemoteSetup<TCustomMocks>(
  token: string,
  createCustomMocks: (baseMocks: BaseMocks) => TCustomMocks,
): ContextTestSetupResult<TCustomMocks> {
  return createContextTestSetup({ authMode: 'remote', token }, createCustomMocks);
}

/**
 * ローカルモードのセットアップを作成
 *
 * @example
 * const setup = createLocalSetup((baseMocks) => ({
 *   fetchData: createMockFetch([])
 * }));
 */
export function createLocalSetup<TCustomMocks>(
  createCustomMocks: (baseMocks: BaseMocks) => TCustomMocks,
): ContextTestSetupResult<TCustomMocks> {
  return createContextTestSetup({ authMode: 'local' }, createCustomMocks);
}

/**
 * 未認証モードのセットアップを作成
 *
 * @example
 * const setup = createUnauthenticatedSetup((baseMocks) => ({
 *   fetchData: createMockFetch([])
 * }));
 */
export function createUnauthenticatedSetup<TCustomMocks>(
  createCustomMocks: (baseMocks: BaseMocks) => TCustomMocks,
): ContextTestSetupResult<TCustomMocks> {
  return createContextTestSetup({ authMode: 'unauthenticated' }, createCustomMocks);
}
