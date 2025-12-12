# Backend (Go)

## 概要

- スマホアプリ向けの API サーバーを Go で提供します。
- Supabase/PostgreSQL を Docker Compose で起動し、マイグレーションや Swagger 生成を Makefile で管理します。
- **クリーンアーキテクチャ**を採用し、保守性・テスタビリティの高い設計を実現しています。

## アーキテクチャ

このプロジェクトは**クリーンアーキテクチャ**に基づいて実装されています。詳細は [ARCHITECTURE.md](./ARCHITECTURE.md) を参照してください。

### レイヤー構成

```text
handlers/ (Presentation) → usecase/ (Application) → repository/ (Infrastructure)
                                      ↓
                                  domain/ (Domain)
```

- **handlers/**: HTTPリクエスト・レスポンスの処理
- **usecase/**: ビジネスロジックの実装
- **repository/**: データベースアクセスの抽象化
- **domain/**: エンティティとドメインモデルの定義
- Supabase/PostgreSQL を用いた API サーバーです（Echo + GORM）。
- ローカル DB は `supabase/docker-compose.yml` を使用します。
- CORS は環境変数で許可オリジンを設定できます。

## 必要要件

- Go 1.23 以上
- Docker / Docker Compose v2
- GNU Make（任意だが推奨）

## 環境変数

- `PORT`（任意）: サーバーの待ち受けポート。未指定時は 8080。占有時は近傍の空きポートへ自動フォールバック。
- `DATABASE_URL`（任意）: Postgres DSN。未設定時はローカル向け既定値を使用。
- `CORS_ALLOW_ORIGIN`（任意）: 例 `http://localhost:3000,https://example.com`（カンマ区切り）。未設定時は `*`。
- `SUPABASE_JWT_SECRET`（必須）: サインアップ時の JWT 検証に使用。

## セットアップ

1. 環境変数を準備します（Supabase 認証は本番のキーをそのまま利用します）。

   ```bash
   cp .env.example .env
   # SUPABASE_URL / SUPABASE_* を本番と同じ値に設定
   # DATABASE_URL は空で OK（Docker Compose 側で上書き）
   ```

2. Docker Compose でローカル DB と Go サーバーを起動します。

   ```bash
   # リポジトリルートで実行
   docker compose up -d db backend
   ```

   - DB はローカルの PostgreSQL コンテナ (`tp-local-postgres`) を使用します。
   - Supabase 認証まわりは `.env` に設定した本番キーをそのまま参照します。

3. ローカルでマイグレーションを適用する場合は `make db-init` を使用してください（事前に `docker compose up -d db` で DB を起こしておく）。

## よく使うコマンド

| コマンド                       | 説明                                                                           |
| ------------------------------ | ------------------------------------------------------------------------------ |
| `make run-dev`                 | DB を起動して `go run ./cmd/server` を実行                                     |
| `make db-up` / `make db-down`  | Docker Compose（リポジトリルートの `docker-compose.yml`）で DB を起動 / 停止   |
| `make db-init`                 | ローカル Docker DB にマイグレーションを適用 (`db-up` を含む)                   |
| `make destroy`                 | DB コンテナを停止しボリュームも削除                                            |
| `make serve`                   | DB が稼働している前提で API のみを起動                                         |
| `make migrate`                 | `migrations/` 配下の SQL をローカル Docker DSN (`MIGRATE_DATABASE_URL`) に適用 |
| `make migrate-new name=<name>` | 連番付きの新規マイグレーションを作成                                           |
| `make test`                    | Go のユニットテストを実行                                                      |
| `make check`                   | CI 等で使える簡易ヘルスチェック                                                |

## ヘルスチェック

- `GET /health`: ライフネス確認
- `GET /health/db`: DB 接続確認（JSON で `{"status":"db: OK"}` を返却）

## 変更点（リファクタ）

- CORS 設定を `config.AllowOrigins` に基づきミドルウェアで適用。
- ヘルスチェックをハンドラーに集約し、DB 版も JSON 応答に統一。
- エラーレスポンスを `handlers.JSONError` に統一。
- `AuthHandler` で Bearer Token 取得・JWT 検証をヘルパー関数へ分離し、変数シャドーイングを解消。

## Windows の補足

`GO_BIN` が PATH 上に見つからない場合は、`Makefile` 実行時に自動検出されます。うまくいかない場合は以下のように明示指定してください。

```bash
make serve GO_BIN="C:/Program Files/Go/bin/go.exe"
```
