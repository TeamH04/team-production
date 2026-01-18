# Backend (Go / Echo)

Go 1.25 / Echo / GORM / PostgreSQL の API サーバー。

## クイックスタート

```bash
# リポジトリルートから
make backend      # DB + バックエンド起動
make db-migrate   # マイグレーションのみ
```

## コマンド

### リポジトリルートから

| コマンド            | 説明                 |
| ------------------- | -------------------- |
| `make backend`      | バックエンド起動     |
| `make db-migrate`   | マイグレーション実行 |
| `make db-reset`     | DBリセット           |
| `make test-backend` | テスト実行           |

### apps/backend で実行

| コマンド     | 説明                   |
| ------------ | ---------------------- |
| `make serve` | サーバー起動           |
| `make tools` | lint/format ツール導入 |
| `make lint`  | golangci-lint 実行     |
| `make fmt`   | gofumpt 実行           |
| `make test`  | テスト実行             |

## 環境変数

| 変数                       | 説明                      | デフォルト                                                      |
| -------------------------- | ------------------------- | --------------------------------------------------------------- |
| `PORT`                     | サーバーポート            | 8080                                                            |
| `DATABASE_URL`             | DB接続文字列              | postgres://postgres:postgres@localhost:5432/app?sslmode=disable |
| `SUPABASE_URL`             | Supabase URL              | -                                                               |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase 公開キー         | -                                                               |
| `SUPABASE_SECRET_KEY`      | Supabase シークレットキー | -                                                               |

## API エンドポイント

- 認証: `/api/auth/*`
- 店舗: `/api/stores/*`
- ユーザー: `/api/users/*`
- お気に入り: `/api/users/:id/favorites`
- 通報: `/api/reports`
- 管理: `/api/admin/*`
- メディア: `/api/media/*`

詳細: [docs/specs/api.md](../../docs/specs/api.md)

## アーキテクチャ

詳細: [docs/specs/backend-architecture.md](../../docs/specs/backend-architecture.md)
