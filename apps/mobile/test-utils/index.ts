/**
 * テストユーティリティのエクスポート
 */

// 共通パッケージからre-export
export {
  createMockApiReview,
  createMockApiStore,
  createMockShop,
  flushPromises,
  setupReactActEnvironment,
  shopToApiStore,
  waitFor,
  // Context依存性注入テスト用ユーティリティ
  createMockApiCall,
  createMockAuth,
  createMockFetch,
  createMockGetAccessToken,
  createMockGetCurrentUser,
  createMockGetSupabase,
  createMockIsSupabaseConfigured,
  createSupabaseStub,
  // 型
  type AuthState,
  type AuthMode,
  type BaseMocks,
  type ContextTestSetupOptions,
  type ContextTestSetupResult,
  // セットアップ関数
  createContextTestSetup,
  createRemoteSetup,
  createLocalSetup,
  createUnauthenticatedSetup,
} from '@team/test-utils';

// Mobile固有のユーティリティ（react-test-renderer依存）
export { act, createContextHarness, createRenderer, type ContextHarness } from './harness.js';
