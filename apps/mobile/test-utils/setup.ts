/**
 * React Test環境のセットアップユーティリティ
 */

const globalForReactAct = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};

/**
 * React act() 環境を有効化
 * テストファイルの先頭でインポートして使用
 */
export const setupReactActEnvironment = (): void => {
  globalForReactAct.IS_REACT_ACT_ENVIRONMENT = true;
};

// 自動セットアップ（インポート時に実行）
setupReactActEnvironment();
