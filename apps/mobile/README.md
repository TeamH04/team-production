# モバイルアプリ (Expo + React Native)

## 概要

- Expo Router と React Native を使ったスマートフォン向けクライアントです。
- Supabase 連携やフィーチャーモジュール方式を想定したディレクトリ構成になっています。

## 前提条件

- Node.js 20 系
- pnpm 10 系 (`corepack enable pnpm` を推奨)
- Expo CLI は `pnpm exec expo` で利用します。

## セットアップ

1. リポジトリ直下で `pnpm install` を実行し依存関係を取得します。
2. `apps/mobile/.env.example` をコピーして `.env` を作成し、必要に応じて Supabase の URL / anon key を設定します。
3. 実機またはシミュレーターで Expo Go をインストールし、QR コード経由で接続できるようにします。

## よく使うコマンド

| コマンド | 説明 |
| --- | --- |
| `pnpm --dir apps/mobile start` | Expo Dev Server を起動 (Metro Bundler) |
| `pnpm --dir apps/mobile android` / `ios` / `web` | 各プラットフォーム向けに Expo を起動 |
| `pnpm --dir apps/mobile lint` | ESLint (expo lint) を実行 |

## 開発サーバーの一括起動

- ルートで `make dev` を実行すると、バックエンドと Expo を同時に起動します。
- Expo のデフォルトポートは **19000** から自動検出され、空きが無い場合は順次インクリメントします。
- Expo を停止する際は `Ctrl+C` を押し、続けて `make backend-db-down` で DB を停止してください。

## 環境変数

- `.env` に設定した値は `process.env.EXPO_PUBLIC_*` としてクライアントから参照できます。
- 現在は Supabase クライアント実装が未着手のため、値が無くてもビルドは失敗しません。

## ディレクトリ構成メモ

- `app/`: Expo Router の画面定義。`(tabs)` ディレクトリにタブ画面を配置します。
- `features/`: ドメインごとの UI / ロジックをまとめるための置き場です。
- `scripts/start-dev.js`: `make dev` で利用する Expo 起動スクリプト。Windows でもポート検出が安定するよう `pnpm exec expo` を内部で呼び出します。

## 補足

- スタイルは `StyleSheet` と NativeWind の併用を想定しています。Tailwind を使う場合は `nativewind.config.js` を調整してください。
- 画像はキャッシュの都合で外部 URL を利用しています。必要に応じて `assets/` に追加し差し替えてください。
