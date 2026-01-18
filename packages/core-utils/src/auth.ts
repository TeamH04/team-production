import { AUTH_REQUIRED, ROLES } from '@team/constants';

export type AuthState =
  | { mode: 'local' }
  | { mode: 'unauthenticated' }
  | { mode: 'remote'; token: string };

export type AuthResolver = () => Promise<AuthState>;

export interface EnsureAuthResult {
  skipped: boolean;
  token?: string;
}

/**
 * Ensures the user is authenticated for remote operations.
 * Returns { skipped: true } for local mode (offline/anonymous operations allowed)
 * Throws AUTH_REQUIRED error for unauthenticated users
 * Returns { skipped: false, token } for authenticated remote users
 */
export async function ensureAuthenticated(resolveAuth: AuthResolver): Promise<EnsureAuthResult> {
  const auth = await resolveAuth();

  if (auth.mode === 'local') {
    return { skipped: true };
  }

  if (auth.mode === 'unauthenticated') {
    throw new Error(AUTH_REQUIRED);
  }

  return { skipped: false, token: auth.token };
}

// =============================================================================
// Owner Role Utilities
// =============================================================================

/**
 * ユーザーメタデータを持つオブジェクトの型
 * Supabase User や類似の認証ユーザーオブジェクトに対応
 */
export type UserWithMetadata = {
  user_metadata?: Record<string, unknown> | null;
  app_metadata?: Record<string, unknown> | null;
} | null;

function getString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function getStringArray(value: unknown): string[] | undefined {
  return Array.isArray(value) && value.every(v => typeof v === 'string')
    ? (value as string[])
    : undefined;
}

/**
 * ユーザーがオーナーロールを持っているかチェックする
 * user_metadata.role または app_metadata.roles/role を確認
 */
export function hasOwnerRole(user: UserWithMetadata): boolean {
  if (!user) return false;
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const app = (user.app_metadata ?? {}) as Record<string, unknown>;

  const metaRole = getString(meta['role']);
  if (metaRole === ROLES.OWNER) return true;

  const appRoles = getStringArray(app['roles']);
  if (appRoles?.includes(ROLES.OWNER)) return true;

  const appRole = getString(app['role']);
  if (appRole === ROLES.OWNER) return true;

  return false;
}

// =============================================================================
// Owner Check Result Type
// =============================================================================

/**
 * オーナーチェックの結果を表す型
 * TUser はプラットフォーム固有のユーザー型（例：Supabase User）
 */
export type OwnerCheck<TUser = UserWithMetadata> = {
  isOwner: boolean;
  user: TUser | null;
};

// =============================================================================
// Optimistic Update Auth Resolution
// =============================================================================

/**
 * 楽観的更新時の認証解決結果
 */
export type OptimisticAuthResult = { skipped: true } | { skipped: false; token: string };

/**
 * 楽観的更新用の認証解決
 * ensureAuthenticated を呼び出し、スキップ時は skipped: true を返す
 * @param authResolver 認証状態を解決する関数
 * @returns OptimisticAuthResult
 */
export async function resolveAuthForOptimisticUpdate(
  authResolver: () => Promise<AuthState>,
): Promise<OptimisticAuthResult> {
  const result = await ensureAuthenticated(authResolver);
  if (result.skipped) {
    return { skipped: true };
  }
  return { skipped: false, token: result.token! };
}
