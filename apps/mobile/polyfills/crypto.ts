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

import {
  normalizeAlgorithm,
  toUint8Array,
  type CryptoBufferSource,
  type DigestAlgorithm,
} from './crypto-utils';

type SubtleCryptoLike = {
  digest(algorithm: DigestAlgorithm, data: CryptoBufferSource): Promise<ArrayBuffer>;
};

type CryptoLike = {
  getRandomValues: typeof ExpoCrypto.getRandomValues;
  randomUUID: typeof ExpoCrypto.randomUUID;
  subtle: SubtleCryptoLike;
};

const existingCrypto = (globalThis as { crypto?: CryptoLike }).crypto ?? ({} as CryptoLike);

const polyfillSubtle: SubtleCryptoLike = {
  async digest(algorithm, data) {
    const normalized = normalizeAlgorithm(algorithm);
    if (normalized !== 'SHA-256' && normalized !== 'SHA256') {
      throw new Error(`Unsupported digest algorithm: ${normalized ?? 'unknown'}`);
    }
    return ExpoCrypto.digest(ExpoCrypto.CryptoDigestAlgorithm.SHA256, toUint8Array(data));
  },
};

// 既存のcryptoオブジェクトのプロパティを展開し、存在しないプロパティのみポリフィルで補完する
// スプレッド演算子で展開した後、個別のプロパティを指定することで、
// 既存の実装がある場合はそれを優先し、ない場合のみポリフィルを使用する
const polyfilledCrypto: CryptoLike = {
  ...existingCrypto,
  getRandomValues: existingCrypto.getRandomValues ?? ExpoCrypto.getRandomValues,
  randomUUID: existingCrypto.randomUUID ?? ExpoCrypto.randomUUID,
  subtle: existingCrypto.subtle ?? polyfillSubtle,
};

// Ensure the global crypto object is available for libraries requiring WebCrypto (e.g., PKCE)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalAny = globalThis as any;
if (!globalAny.crypto) {
  // cryptoオブジェクトが存在しない場合は、ポリフィル全体を設定
  globalAny.crypto = polyfilledCrypto;
} else {
  // 既存のcryptoオブジェクトがある場合は、存在しないプロパティのみを設定
  // 注意: subtle等のread-onlyプロパティは上書きできないため、個別に設定する
  if (!globalAny.crypto.getRandomValues) {
    globalAny.crypto.getRandomValues = polyfilledCrypto.getRandomValues;
  }
  if (!globalAny.crypto.randomUUID) {
    globalAny.crypto.randomUUID = polyfilledCrypto.randomUUID;
  }
  // subtleはgetterのみのプロパティの場合があるため、存在しない場合のみ設定を試みる
  if (!globalAny.crypto.subtle) {
    try {
      globalAny.crypto.subtle = polyfillSubtle;
    } catch {
      // read-onlyの場合は無視（既存のsubtle実装を使用）
    }
  }
}
