# モバイルアプリ (Expo + React Native)

## 概要

- Expo Router と React Native を用いたスマートフォン向けクライアントです。
- Supabase を認証・API 連携に採用し、環境変数で設定可能です。

## 前提

- Node.js 20 以上
- pnpm 10 以上（`corepack enable pnpm` 推奨）
- Expo CLI は `pnpm exec expo` で利用します。

## セットアップ

1. リポジトリ直下で `pnpm install` を実行し依存関係を取得します。
2. `apps/mobile/.env.example` をコピーして `.env` を作成し、Supabase の URL と anon key を設定します。
3. 端末またはシミュレータで Expo Go をインストールし、QR コードから接続できるようにします。

## 主なコマンド

| コマンド                                         | 説明                                   |
| ------------------------------------------------ | -------------------------------------- |
| `pnpm --dir apps/mobile start`                   | Expo Dev Server を起動 (Metro Bundler) |
| `pnpm --dir apps/mobile android` / `ios` / `web` | 各プラットフォーム向けに Expo を起動   |
| `pnpm --dir apps/mobile lint`                    | ESLint (expo lint) を実行              |

## 開発時の補足

- ルートの `make dev` を実行すると、バックエンドと Expo を一括起動します。
- Expo のデフォルトポートは 19000 系です。競合する場合はポートを変更してください。
- Expo 終了後は `Ctrl+C`。必要に応じて `make backend-db-down` で DB を停止してください。

## 環境変数

- `.env` の値は `process.env.EXPO_PUBLIC_*` としてクライアントから参照されます。
- Supabase クライアントはこの値が未設定の場合に初期化エラーとなります。

## ディレクトリ構成

- `app/`: Expo Router のルート。`(tabs)` ディレクトリにタブ UI を配置。
- `features/`: ドメインごとの UI / ロジックをまとめるための層です。
- `scripts/start-dev.js`: `make dev` で利用される起動スクリプト。Windows でも `pnpm exec expo` を正しく呼び出します。

## 注意

- スタイリングは `StyleSheet` を基本としつつ、NativeWind も併用可能です。Tailwind を使う場合は `nativewind.config.js` を調整してください。
- 画像は開発用の外部 URL を使用しています。必要に応じて `assets/` に追加し差し替えてください。

## ログイン（Supabase OAuth）

- 必要な環境変数（`.env` あるいは OS の環境変数）
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- リダイレクト設定（Supabase コンソール > Authentication > URL Configuration）
  - 開発中は Expo の AuthSession プロキシを利用します。`https://auth.expo.dev/...`（プロジェクトで異なる URL）を登録してください。
    - アプリ側では `makeRedirectUri({ useProxy: true })` でこの URL を生成しています。
  - 将来のネイティブ（スタンドアロン）向けには `shopmobile://auth/callback` のスキームも登録可能です。
- プロバイダー設定（Authentication > Providers）
  - Google / Apple を有効化し、クライアント ID などを設定してください。

トラブルシューティング

- 端末で戻れない/白画面: Supabase のリダイレクト URL に `https://auth.expo.dev/...` を登録しているか確認してください。物理端末から `localhost` は使用できません。
- 401/invalid_client: Provider のクライアント ID/シークレットを確認してください。
- セッションが作成されない: `auth/callback` は `?code=` と `#access_token=` のどちらでも返り得るため、双方に対応する実装です。
- `crypto.subtle.digest is not a function`: `expo-standard-web-crypto` を利用しています（内部で `expo-random` が必要）。

## Safe Area の方針（2025-10-14 更新）

- ルート `app/_layout.tsx` は `SafeAreaProvider` のみを配置し、個々の画面では不要なパディングをしません。
- タブ配下 `app/(tabs)/_layout.tsx` は `react-native-safe-area-context` の `SafeAreaView` を使用し、`edges={['top','left','right']}` を適用しています。
- ヘッダー表示のあるスタック（例: `/shop/*`, `/profile/*`）は React Navigation のヘッダーに任せ、二重パディングを避けています。
- `react-native` 標準の `SafeAreaView` は使用していません。必要に応じて ESLint でインポートを禁止しています。

## ログイン後のリダイレクト（2025-10-15 更新）

ログイン完了後にアプリの画面へ戻らないことがある問題を修正しました。成功時は以下に明示的に遷移します。

- 一般ユーザー: `/(tabs)`（ホームタブ）へ `router.replace()`
- オーナー: `/owner` へ `router.replace()`

変更ファイル:

- `apps/mobile/app/login.tsx`: 成功時にトークンを保存後、`/(tabs)` または `/owner` へ直接 `replace`。あわせて `WebBrowser.dismissBrowser()` を呼び出してブラウザを確実に閉じ、不要な `console.log` を削除しました。
- `apps/mobile/app/auth/callback.tsx`: `code` 交換完了後に `/(tabs)` または `/owner` へ `replace` するよう統一。

補足とヒント:

- 物理端末でのテスト時は、Supabase の Authentication > URL Configuration に `https://auth.expo.dev/...`（Expo AuthSession プロキシ）を必ず登録してください。
- 401/invalid_client の場合は Provider のクライアントID/シークレット設定を確認してください。
- `auth/callback` はクエリ（`?code=`）とハッシュ（`#access_token=`）の双方に対応できるよう実装済みです。
