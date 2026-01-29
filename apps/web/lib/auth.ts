/**
 * 認証ヘルパー
 * 将来的にSupabase Authと統合する
 */

/**
 * 現在のアクセストークンを取得
 * 認証未実装の場合は null を返す
 */
export async function getAccessToken(): Promise<string | null> {
  // TODO: Supabase Auth統合後に実装
  // const supabase = createBrowserClient();
  // const { data: { session } } = await supabase.auth.getSession();
  // return session?.access_token ?? null;
  return null;
}

/**
 * 現在のユーザーIDを取得
 * 認証未実装の場合は null を返す
 */
export async function getCurrentUserId(): Promise<string | null> {
  // TODO: Supabase Auth統合後に実装
  return null;
}

/**
 * ユーザーが認証済みかどうか
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getAccessToken();
  return token !== null;
}

/**
 * 認証が必要な操作をラップするヘルパー関数
 * トークンが取得できない場合はエラーをスロー
 */
export async function withAuth<T>(fn: (token: string) => Promise<T>): Promise<T> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('認証が必要です');
  }
  return fn(token);
}
