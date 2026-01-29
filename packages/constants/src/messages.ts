export const ERROR_MESSAGES = {
  UNKNOWN: 'Unknown error',
  STORE_FETCH_FAILED: '店舗情報の取得に失敗しました',
  AUTH_REQUIRED: 'ログインが必要です',
  SUPABASE_NOT_CONFIGURED:
    'Supabaseの環境変数が未設定です。EXPO_PUBLIC_SUPABASE_URL と EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY を設定してください。',
  SUPABASE_NOT_CONFIGURED_EN:
    'Supabase is not configured. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.',
  SUBMIT_FAILED: '送信に失敗しました',
} as const;

export const VALIDATION_MESSAGES = {
  REQUIRED_SUFFIX: 'は必須です',
  INPUT_MISSING_TITLE: '入力不足',
  INPUT_ERROR_TITLE: '入力エラー',
} as const;
