# Backend (Go / Echo)

## 概要

- Go 1.24 / Echo / GORM / PostgreSQL の API サーバー。
- Supabase Auth/Storage 連携と JWT 検証ミドルウェアで RBAC を適用。
- 主要ルーティング: `/api/auth`、`/api/stores`、`/api/menus`、`/api/reviews`、`/api/users`、`/api/favorites`、`/api/reports`、`/api/admin/*`、`/api/media/*`。

## 前提条件

- Go 1.24 系。
- Docker / Docker Compose v2。
- pnpm（ルート依存の取得に使用）。

## セットアップ手順

1. 依存を取得する。

   ```bash
   pnpm install
   ```

2. 環境変数を設定する。

   ```bash
   cp apps/backend/.env.example apps/backend/.env
   ```

   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_JWT_SECRET`

3. ローカルで起動する。

   ```bash
   make db-up      # Postgres のみ
   make backend    # Postgres + API を Docker Compose で起動
   ```

4. マイグレーションを適用する。

   ```bash
   make db-init
   ```

## 主なコマンド（apps/backend/Makefile）

| コマンド                                       | 用途                                                  |
| ---------------------------------------------- | ----------------------------------------------------- |
| `make run-dev`                                 | Postgres を起動し `go run ./cmd/server` を実行。      |
| `make serve`                                   | 既存の DB で API のみ起動。                           |
| `make db-up` / `make db-down` / `make destroy` | Docker Compose で DB 起動/停止/ボリューム削除。       |
| `make db-init`                                 | ローカル Postgres に `migrations/` を適用。           |
| `make migrate-new name=<name>`                 | 連番付き SQL マイグレーションを作成。                 |
| `make migrate`                                 | `MIGRATE_DATABASE_URL` に対してマイグレーション適用。 |
| `make test`                                    | Go テスト実行。                                       |
| `make check`                                   | 簡易ヘルスチェック。                                  |

## 環境変数

- ポート: `PORT`（デフォルト 8080。占有時は空きポートに自動フォールバック）。
- DB: `DATABASE_URL`（未設定時は `postgres://postgres:postgres@localhost:5432/app?sslmode=disable`）。
- CORS: `CORS_ALLOW_ORIGIN`（カンマ区切り。未設定は `*`）。
- Supabase: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`。
- Storage: `SUPABASE_STORAGE_BUCKET`（任意。デフォルト `media`）。

## API 概要

- 認証: `/api/auth/signup`, `/login`, `/me`, `/role`。
- 店舗: `/api/stores`, `/api/stores/:id`, `/api/stores/:id/menus`, `/api/stores/:id/reviews`。
- ユーザー/お気に入り: `/api/users/me`, `/api/users/:id`, `/api/users/:id/favorites`。
- 通報/管理: `/api/reports`, `/api/admin/*`。
- メディア: `/api/media/upload`, `/api/media/:id`。
- 詳細は `docs/API設計書.md` を参照。

## 開発時の補足

- スキーマ基点は `migrations/000001_init.up.sql`。GORM モデルとの差分（`is_approved`、`updated_at`、メニュー価格など）は追加マイグレーションで補完する。
- `GO_BIN` が見つからない場合は `make serve GO_BIN="C:/Program Files/Go/bin/go.exe"` のように指定する。
