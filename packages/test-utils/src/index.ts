/**
 * @team/test-utils
 *
 * mobile/web で共有するテストユーティリティ
 */
export {
  createMockApiReview,
  createMockApiStore,
  createMockReviewWithUser,
  createMockShop,
  generateMockReviews,
  MOCK_REVIEW_TEMPLATES,
  MOCK_USER_NAMES,
  shopToApiStore,
  type GenerateMockReviewsOptions,
} from './fixtures';
export { createLocalStorageMock } from './mocks';
export { nextImageMock, nextLinkMock } from './webMocks';
export { setupReactActEnvironment } from './setup';
export { flushPromises, waitFor } from './async';

// Context/Hook Harness（react-test-renderer依存）
export {
  act,
  createContextHarness,
  createHookHarness,
  createRenderer,
  type ContextHarness,
  type HookHarness,
} from './harness';

// Shop Core モック
export { shopCoreMock, TEST_CATEGORIES, TEST_SHOPS } from './shopCoreMock';

// Context テスト用ヘルパー
export {
  // 型
  type AuthMode,
  type AuthState,
  type BaseMocks,
  type ContextTestSetupOptions,
  type ContextTestSetupResult,
  // 基本モック作成関数
  createMockAuth,
  createMockFetch,
  createMockApiCall,
  createSupabaseStub,
  createMockGetSupabase,
  createMockIsSupabaseConfigured,
  createMockGetAccessToken,
  createMockGetCurrentUser,
  // セットアップ関数
  createContextTestSetup,
  createRemoteSetup,
  createLocalSetup,
  createUnauthenticatedSetup,
} from './contextTestHelpers';
