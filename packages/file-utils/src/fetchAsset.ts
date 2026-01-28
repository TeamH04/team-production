/**
 * アセット情報
 */
export interface AssetInfo {
  uri: string;
  contentType: string;
}

/**
 * 許可されたURIスキーム
 */
const ALLOWED_URI_SCHEMES = ['file:', 'https:', 'http:', 'blob:', 'data:'];

/**
 * URIスキームを検証する
 * @param uri - 検証するURI
 * @throws 許可されていないスキームの場合
 */
function validateUri(uri: string): void {
  const isAllowed = ALLOWED_URI_SCHEMES.some(scheme => uri.startsWith(scheme));
  if (!isAllowed) {
    throw new Error(`Invalid URI scheme. Allowed: ${ALLOWED_URI_SCHEMES.join(', ')}`);
  }
}

/**
 * URI からファイルを取得し、Uint8Array に変換する
 * 複数の環境（ブラウザ、React Native）に対応
 *
 * @param asset - アセット情報（uri と contentType）
 * @returns Uint8Array に変換されたファイルデータ
 * @throws ファイル読み込みに失敗した場合
 *
 * @example
 * const bytes = await fetchAssetAsBytes({
 *   uri: 'file:///path/to/image.jpg',
 *   contentType: 'image/jpeg',
 * });
 */
export async function fetchAssetAsBytes(asset: AssetInfo): Promise<Uint8Array> {
  validateUri(asset.uri);
  const response = await fetch(asset.uri);

  if (!response.ok) {
    throw new Error(`Fetch failed with status: ${response.status}`);
  }

  // 方法1: arrayBuffer が直接使える場合（モダンブラウザ）
  if (typeof response.arrayBuffer === 'function') {
    return new Uint8Array(await response.arrayBuffer());
  }

  // 方法2: Blob 経由で arrayBuffer を取得
  const blob = await response.blob();
  if (typeof (blob as { arrayBuffer?: () => Promise<ArrayBuffer> }).arrayBuffer === 'function') {
    return new Uint8Array(await blob.arrayBuffer());
  }

  // 方法3: FileReader を使用（レガシー環境）
  if (typeof FileReader !== 'undefined') {
    const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error ?? new Error('file read failed'));
      reader.onload = () => {
        const result = reader.result;
        if (result instanceof ArrayBuffer) {
          resolve(result);
        } else {
          reject(new Error('file read failed'));
        }
      };
      reader.readAsArrayBuffer(blob);
    });
    return new Uint8Array(buffer);
  }

  throw new Error('file read failed: no supported method available');
}
