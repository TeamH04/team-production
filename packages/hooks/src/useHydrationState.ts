import { useSyncExternalStore } from 'react';

/**
 * SSRハイドレーション完了を検知するフック
 *
 * サーバー側レンダリング時とクライアント側のハイドレーション前は false を返し、
 * ハイドレーション完了後は true を返します。
 *
 * 主にSSR/SSG対応のWebアプリケーションで、サーバーとクライアントの
 * レンダリング結果を一致させるために使用します。
 *
 * @returns ハイドレーション完了状態（true: 完了、false: 未完了/サーバー側）
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const hasHydrated = useHydrationState();
 *
 *   if (!hasHydrated) {
 *     // サーバー側またはハイドレーション前はデフォルト値を返す
 *     return <div>Loading...</div>;
 *   }
 *
 *   // ハイドレーション後はクライアント固有の値を使用可能
 *   return <div>{window.innerWidth}px</div>;
 * }
 * ```
 */
export function useHydrationState(): boolean {
  return useSyncExternalStore(
    // subscribe: 何も購読しない（状態は変化しない）
    () => () => {},
    // getSnapshot: クライアント側では true
    () => true,
    // getServerSnapshot: サーバー側では false
    () => false,
  );
}
