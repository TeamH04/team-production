import { fetchAssetAsBytes, type AssetInfo } from './fetchAsset';

/**
 * アップロード結果
 */
export interface UploadResult {
  error: Error | null;
}

/**
 * ストレージバケットのインターフェース
 * Supabase Storage の from(bucket) が返すオブジェクトと互換
 */
export interface StorageBucket {
  uploadToSignedUrl: (
    path: string,
    token: string,
    bytes: Uint8Array,
    options: { contentType: string; upsert: boolean },
  ) => Promise<UploadResult>;
}

/**
 * アップロード設定
 */
export interface UploadConfig {
  /**
   * アップロード先のパス
   */
  path: string;

  /**
   * 署名付きトークン
   */
  token: string;

  /**
   * アセット情報
   */
  asset: AssetInfo & { fileName: string; fileSize?: number };

  /**
   * ストレージバケット
   */
  bucket: StorageBucket;

  /**
   * 既存ファイルを上書きするか（デフォルト: true）
   */
  upsert?: boolean;
}

/**
 * 署名付きURLにファイルをアップロードする
 *
 * @param config - アップロード設定
 * @throws アップロードに失敗した場合
 *
 * @example
 * await uploadToSignedUrl({
 *   path: 'reviews/123/image.jpg',
 *   token: signedToken,
 *   asset: { uri: 'file:///...', contentType: 'image/jpeg', fileName: 'image.jpg' },
 *   bucket: supabase.storage.from('review-images'),
 * });
 */
export async function uploadToSignedUrl(config: UploadConfig): Promise<void> {
  const { path, token, asset, bucket, upsert = true } = config;

  // 必須パラメータのバリデーション
  if (!path?.trim()) {
    throw new Error('Upload path is required');
  }
  if (!token?.trim()) {
    throw new Error('Upload token is required');
  }
  if (!asset?.uri?.trim()) {
    throw new Error('Asset URI is required');
  }

  const bytes = await fetchAssetAsBytes(asset);

  const { error } = await bucket.uploadToSignedUrl(path, token, bytes, {
    contentType: asset.contentType,
    upsert,
  });

  if (error) {
    throw new Error(`upload failed: ${error.message}`);
  }
}
