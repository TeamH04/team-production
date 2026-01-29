/**
 * 認証ヘルパー
 *
 * 現在は認証未実装のため、認証情報を返す関数はすべて null を返す。
 *
 * TODO: Supabase Auth統合後に各関数を実装する
 */

/** 現在のアクセストークンを取得 */
export async function getAccessToken(): Promise<string | null> {
  // const supabase = createBrowserClient();
  // const { data: { session } } = await supabase.auth.getSession();
  // return session?.access_token ?? null;
  return null;
}

/** 現在のユーザーIDを取得 */
export async function getCurrentUserId(): Promise<string | null> {
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
