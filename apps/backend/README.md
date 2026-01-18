# Backend (Go / Echo)

## 概要

- Go 1.24 / Echo / GORM / PostgreSQL の API サーバー。
- Supabase Auth/Storage 連携と JWT 検証ミドルウェアで RBAC を適用。
- 主要ルーティング: `/api/auth`、`/api/stores`、`/api/menus`、`/api/reviews`、`/api/users`、`/api/favorites`、`/api/reports`、`/api/admin/*`、`/api/media/*`。

## 前提条件

- Go 1.24 系。
- Docker / Docker Compose v2。
- pnpm（ルート依存の取得に使用）。
- golang-migrate（DB マイグレーションツール）。

### golang-migrate のインストール

```bash
go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest
```

インストール後、`$HOME/go/bin` が PATH に含まれていることを確認する。

```bash
export PATH=$PATH:$HOME/go/bin
```

永続化する場合は `~/.bashrc` または `~/.zshrc` に追加する。

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
   - `SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SECRET_KEY`

3. DB 起動 + マイグレーション

   ```bash
   make db-migrate
   ```

4. バックエンド起動

   ```bash
   make backend
   ```

## 主なコマンド（リポジトリルートから実行）

| コマンド          | 用途                         |
| ----------------- | ---------------------------- |
| `make backend`    | バックエンド起動             |
| `make db-start`   | DB 起動                      |
| `make db-stop`    | DB 停止                      |
| `make db-migrate` | マイグレーション実行         |
| `make db-reset`   | DB リセット（drop + 再作成） |
| `make db-destroy` | DB 完全削除（ボリュームも）  |
| `make test`       | テスト実行                   |

## 環境変数

- ポート: `PORT`（デフォルト 8080。占有時は空きポートに自動フォールバック）。
- DB: `DATABASE_URL`（未設定時は `postgres://postgres:postgres@localhost:5432/app?sslmode=disable`）。
- CORS: `CORS_ALLOW_ORIGIN`（カンマ区切り。未設定は `*`）。
- Supabase: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`。
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
