import { createApiDataSource } from './apiDataSource';
import { createMockDataSource } from './mockDataSource';

import type { DataSource, DataSourceType } from './types';

export type { CreateReviewInput, DataSource, DataSourceType } from './types';

/**
 * 環境変数でデータソースの種類を決定
 * デフォルトはモック（現行動作を維持）
 */
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== 'false';

/**
 * 現在のデータソースタイプ
 */
export const dataSourceType: DataSourceType = USE_MOCK_DATA ? 'mock' : 'api';

/**
 * データソースのシングルトンインスタンス
 * 環境変数に基づいてモックまたはAPIデータソースを返す
 */
export const dataSource: DataSource = USE_MOCK_DATA
  ? createMockDataSource()
  : createApiDataSource();

/**
 * データソースがモックモードかどうか
 */
export function isMockMode(): boolean {
  return USE_MOCK_DATA;
}
