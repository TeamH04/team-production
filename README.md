# Team Production Monorepo

## 概要

- モバイル（Expo）、Web（Next.js）、Go API をまとめた pnpm モノレポ。
- フロントは `@team/shop-core` のダミー店舗データで動作。
- バックエンドは Supabase Auth/Storage 連携の Echo + GORM。

## 前提条件

- Node.js 24.x / pnpm 10 以上（`corepack enable pnpm` 推奨）。
- Go 1.24 系。
- Docker Compose v2。

## セットアップ手順

1. 依存を取得する。

   ```bash
   corepack enable pnpm
   pnpm install
   ```

2. 環境変数を用意する。
   - モバイル: `apps/mobile/.env.example` → `.env`
     - `EXPO_PUBLIC_SUPABASE_URL`
     - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
     - `EXPO_PUBLIC_WEB_BASE_URL`
   - バックエンド: `apps/backend/.env.example` → `.env`
     - `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_JWT_SECRET`
3. Windows は Git Bash で `make` を利用する。

## 主なコマンド

| コマンド                       | 用途                                                        |
| ------------------------------ | ----------------------------------------------------------- |
| `pnpm dev`                     | Expo (apps/mobile) をトンネル付きで起動。キャッシュクリア。 |
| `pnpm --dir apps/mobile start` | モバイルのみを起動。                                        |
| `pnpm --dir apps/web dev`      | Web を起動（http://localhost:3000）。                       |
| `make dev`                     | Postgres + Go API + Expo を同時起動。                       |
| `make backend`                 | Postgres + Go API を Docker Compose で起動。                |
| `make db-up` / `make db-down`  | Postgres スタックの起動 / 停止。                            |
| `make db-init`                 | ローカル Postgres にマイグレーション適用。                  |

## 画面と機能（概要）

- モバイル: ホーム/検索/お気に入り/マイページのタブ構成。Supabase OAuth ログイン。オーナー向け UI あり。
- Web: カテゴリ・キーワード検索付きの店舗一覧と詳細ページ。

## 開発時の補足

- ルートの `pnpm dev` は Expo キャッシュを毎回クリアする起動ラッパー。
- モバイル起動は `apps/mobile/scripts/start-dev.js` を経由し、非推奨フラグを排除。

## 環境変数（最低限）

- モバイル: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_WEB_BASE_URL`。
- バックエンド: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`。

## リポジトリ構成

| パス                 | 役割                                                |
| -------------------- | --------------------------------------------------- |
| `apps/mobile`        | Expo Router クライアント。Supabase OAuth 連携。     |
| `apps/web`           | Next.js アプリ。検索/詳細 UI。                      |
| `apps/backend`       | Go API。認証と店舗/メニュー/レビュー/お気に入り等。 |
| `packages/`          | 共有データ・テーマ・型定義。                        |
| `docs/`              | PRD / API / DB / 画面遷移ドキュメント。             |
| `docker-compose.yml` | Postgres + API のローカルスタック。                 |

## 品質チェック

- `pnpm run lint`
- `pnpm run format:check`
- `pnpm run typecheck`
- `make -C apps/backend test`
