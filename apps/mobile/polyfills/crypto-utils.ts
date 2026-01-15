/**
 * crypto.ts で使用するユーティリティ関数
 * テスト可能にするため、純粋な関数として分離
 */

export type DigestAlgorithm = 'SHA-256' | 'SHA256' | { name?: string };
export type ArrayBufferViewLike =
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array
  | DataView;

export type CryptoBufferSource = ArrayBuffer | SharedArrayBuffer | ArrayBufferViewLike;

/**
 * アルゴリズム名を正規化する
 * 文字列の場合は大文字に変換し、オブジェクトの場合はnameプロパティを大文字に変換する
 */
export function normalizeAlgorithm(algorithm: DigestAlgorithm): string | undefined {
  if (typeof algorithm === 'string') return algorithm.toUpperCase();
  if (typeof algorithm === 'object' && 'name' in algorithm && algorithm.name) {
    return String(algorithm.name).toUpperCase();
  }
  return undefined;
}

/**
 * 様々なバッファ形式をArrayBufferに変換する
 */
export function toArrayBuffer(data: CryptoBufferSource): ArrayBuffer {
  if (ArrayBuffer.isView(data)) {
    const view = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    return new Uint8Array(view).buffer;
  }
  if (data instanceof ArrayBuffer) return data;
  if (typeof SharedArrayBuffer !== 'undefined' && data instanceof SharedArrayBuffer) {
    return new Uint8Array(data).slice().buffer;
  }
  throw new TypeError('Unsupported BufferSource type');
}
