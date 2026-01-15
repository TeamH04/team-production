/**
 * React Native / Expo 向け Web Crypto API ポリフィル
 *
 * このモジュールは React Native 環境で Web Crypto API を利用可能にするポリフィルです
 * PKCE認証などで必要な crypto.subtle.digest (SHA-256) やその他の暗号関数を提供します
 *
 * 重要: react-native-get-random-values は crypto.getRandomValues を使用する
 * コードより先にインポートする必要がある
 */
import 'react-native-get-random-values';

import * as ExpoCrypto from 'expo-crypto';

type DigestAlgorithm = 'SHA-256' | 'SHA256' | { name?: string };
type ArrayBufferViewLike =
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

type CryptoBufferSource = ArrayBuffer | SharedArrayBuffer | ArrayBufferViewLike;

type SubtleCryptoLike = {
  digest(algorithm: DigestAlgorithm, data: CryptoBufferSource): Promise<ArrayBuffer>;
};

type CryptoLike = {
  getRandomValues: typeof ExpoCrypto.getRandomValues;
  randomUUID: typeof ExpoCrypto.randomUUID;
  subtle: SubtleCryptoLike;
};

function normalizeAlgorithm(algorithm: DigestAlgorithm) {
  if (typeof algorithm === 'string') return algorithm.toUpperCase();
  if (typeof algorithm === 'object' && 'name' in algorithm && algorithm.name) {
    return String(algorithm.name).toUpperCase();
  }
  return undefined;
}

function toArrayBuffer(data: CryptoBufferSource): ArrayBuffer {
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

const existingCrypto = (globalThis as { crypto?: CryptoLike }).crypto ?? ({} as CryptoLike);

const subtle: SubtleCryptoLike =
  existingCrypto.subtle ??
  ({
    async digest(algorithm, data) {
      const normalized = normalizeAlgorithm(algorithm);
      if (normalized !== 'SHA-256' && normalized !== 'SHA256') {
        throw new Error(`Unsupported digest algorithm: ${normalized ?? 'unknown'}`);
      }
      return ExpoCrypto.digest(ExpoCrypto.CryptoDigestAlgorithm.SHA256, toArrayBuffer(data));
    },
  } as SubtleCryptoLike);

const polyfilledCrypto: CryptoLike = {
  ...existingCrypto,
  getRandomValues: existingCrypto.getRandomValues ?? ExpoCrypto.getRandomValues,
  randomUUID: existingCrypto.randomUUID ?? ExpoCrypto.randomUUID,
  subtle: existingCrypto.subtle ?? subtle,
};

// Ensure the global crypto object is available for libraries requiring WebCrypto (e.g., PKCE)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalAny = globalThis as any;
if (!globalAny.crypto) {
  globalAny.crypto = polyfilledCrypto;
} else {
  Object.assign(globalAny.crypto, polyfilledCrypto);
}
