/**
 * テストユーティリティのエクスポート
 */

// 共通パッケージからre-export
export {
  createMockApiStore,
  createMockShop,
  flushPromises,
  setupReactActEnvironment,
  waitFor,
} from '@team/test-utils';

// Web固有のユーティリティ（Next.jsモック）
export { createLocalStorageMock, nextImageMock, nextLinkMock } from './mocks';
