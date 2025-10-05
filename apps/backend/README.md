# Backend (Go)

## 概要

- スマホアプリ向けの API サーバーを Go で提供します。
- Supabase/PostgreSQL を Docker Compose で起動し、マイグレーションや Swagger 生成を Makefile で管理します。

## 前提条件

- Go 1.23 以降
- Docker / Docker Compose v2
- GNU Make
- 任意: `github.com/swaggo/swag`, `github.com/golang-migrate/migrate/v4` を CLI として利用

## セットアップ手順

1. 依存ライブラリを取得

   ```bash
   go mod tidy
   make tools   # swag / migrate の CLI をインストール
   ```

2. 環境変数ファイルを作成

   ```bash
   cp .env.example .env
   ```

   - `PORT`: API の待受ポート (デフォルト 8080)

## 主なコマンド

| コマンド | 説明 |
| --- | --- |
| `make run-dev` | DB を起動して `go run ./cmd/server` を実行 |
| `make db-up` / `make db-down` | Docker Compose で DB を起動 / 停止 |
| `make db-init` | ローカル Docker (Supabase) にマイグレーションを適用 (`db-up` を含む) |
| `make destroy` | DB コンテナを停止しボリュームも削除 |
| `make serve` | DB が稼働している前提で API のみを起動 |
| `make migrate` | `migrations/` 配下の SQL をローカル Docker DSN (`MIGRATE_DATABASE_URL`) に適用 |
| `make migrate-new name=<name>` | 連番付きの新規マイグレーションを作成 |
| `make test` | Go のユニットテストを実行 |
| `make check` | CI 等で使える簡易ヘルスチェック |

## Windows での注意

- `make backend` / `make run-dev` は下記の順で Go 実行ファイルを自動検出します。
  1. `PATH` 上の `go`
  2. `where.exe go`
  3. 既定のパス `C:/Program Files/Go/bin/go.exe` または `C:/Go/bin/go.exe`
- 独自パスを使う場合は `make backend GO_BIN="D:/Toolchains/go/bin/go.exe"` のように `GO_BIN` を上書きしてください。
