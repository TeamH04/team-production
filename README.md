# Backend (Go)

## 概要

- スマホアプリ向けの API サーバーを Go で実装しています。
- Supabase/PostgreSQL を Docker Compose で起動し、Swagger ドキュメントやマイグレーションを Makefile で管理します。

## 前提条件

- Go 1.23 以降
- Docker / Docker Compose v2
- GNU Make
- （任意）`github.com/swaggo/swag` と `github.com/golang-migrate/migrate/v4` を CLI ツールとして利用します。

## セットアップ

1. 依存関係の取得

   ```bash
   go mod tidy
   make tools   # swag / migrate の CLI をインストール
   ```

2. 環境変数の準備

   ```bash
   cp .env.example .env
   ```

   - `PORT`: API サーバーの待受ポート（デフォルト 8080）
   - `DATABASE_URL`: Supabase/PostgreSQL への接続 URL（例: `postgres://postgres:postgres@localhost:5432/app?sslmode=disable`）
   - `.env` を用意しない場合でも、開発用のデフォルト DSN（`postgres://postgres:postgres@localhost:5432/app?sslmode=disable`）で起動を試みます。カスタム環境では必ず上書きしてください。

## サーバーの起動

```bash
make run-dev
```

- 初回起動時に `db-up` で Docker Compose がバックグラウンドで立ち上がり、その後 `go run ./cmd/server` が実行されます。
- 停止する際は `Ctrl + C` でサーバーを止めた上で `make backend-db-down`（ルート Makefile）または `make db-down` でコンテナを停止してください。
- 永続化ボリュームも削除する場合は `make destroy` を使用します。

## 代表的なターゲット

| ターゲット | 説明 |
| --- | --- |
| `make db-up` | データベースコンテナを起動 |
| `make db-down` | データベースコンテナを停止 |
| `make serve` | データベースが起動している前提で API サーバーのみを実行 |
| `make migrate` | `migrations/` の SQL を `DATABASE_URL` に適用 |
| `make migrate-new name=<name>` | 連番付きの新しいマイグレーションファイルを作成 |
| `make test` | Go のユニットテストを実行 |
| `make check` | CI などで使える簡易ヘルスチェック |

## Windows での Go 実行パス

- `make backend` や `make run-dev` は、`GO_BIN` が未指定でも以下の順で Go を自動検出します。
  1. `PATH` 上の `go`
  2. PowerShell の `Get-Command go`
  3. 既定のインストールパス `C:/Program Files/Go/bin/go.exe` または `C:/Go/bin/go.exe`
- Go を別ディレクトリに配置している場合は、以下のように明示的にパスを渡してください。

  ```bash
  make backend GO_BIN="D:/Toolchains/go/bin/go.exe"
  ```

## 補足

- API ドキュメント関連の詳細は `../../docs/ARCHITECTURE.md` を参照してください。
