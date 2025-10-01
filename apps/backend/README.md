# Backend (Go)

## 概要

- スマホアプリ向け API サーバーを Go で提供します。
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
   - `DATABASE_URL`: Supabase/PostgreSQL への接続文字列
   - `.env` が無い場合は開発用デフォルト DSN (`postgres://postgres:postgres@localhost:5432/app?sslmode=disable`) を使用しますが、認証エラーになるため基本は `.env` を作成してください。

## 主なコマンド

| コマンド | 説明 |
| --- | --- |
| `make run-dev` | DB 起動後に `go run ./cmd/server` を実行 |
| `make db-up` / `make db-down` | Docker Compose で DB を起動 / 停止 |
| `make destroy` | DB コンテナを停止しボリュームも削除 |
| `make serve` | DB が起動している前提で API サーバーのみを実行 |
| `make migrate` | `migrations/` にある SQL を `DATABASE_URL` に適用 |
| `make migrate-new name=<name>` | 連番付きの新規マイグレーションを作成 |
| `make test` | Go のユニットテストを実行 |
| `make check` | 簡易ヘルスチェック (CI などで利用)

## Windows での注意

- `make backend` / `make run-dev` では、以下の順で Go 実行ファイルを自動検出します。
  1. `PATH` 上の `go`
  2. `where.exe go`
  3. 既定のインストールパス `C:/Program Files/Go/bin/go.exe` または `C:/Go/bin/go.exe`
- 独自パスを使用する場合は `make backend GO_BIN="D:/Toolchains/go/bin/go.exe"` のように `GO_BIN` を上書きしてください。

## サーバーの挙動

- `PORT` が空の場合でも自動的に空きポートを探索し、競合時にはログにフォールバック先を表示します。
- `.env` に有効な DB URL が設定されていないと起動できません。ログに表示される警告を確認してください。

## 補足

- API アーキテクチャやエンドポイント設計は `../../docs/ARCHITECTURE.md` を参照してください。
