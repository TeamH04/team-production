# Supabase ローカル環境

## 概要

`docker-compose.yml` でローカル PostgreSQL + pgAdmin を起動する補助用の構成です。バックエンド API (`apps/backend`) のローカル開発は、リポジトリルートの `docker-compose.yml` で Go サーバーと DB をまとめて起動する運用に統一しています。ここでは単体で DB を動かしたい場合のみに利用してください。

## セットアップ

1. 必要に応じて `.env.example` をコピーして `.env` を作成します。

   ```bash
   cp .env.example .env
   ```

   - `POSTGRES_PASSWORD` やポート設定を変更したい場合に編集してください。空のままでも Compose が起動します。

2. リポジトリのルートまたはこのディレクトリで以下を実行します。

   ```bash
   # リポジトリのルートで実行する場合
   docker compose -f supabase/docker-compose.yml up -d

   # このディレクトリで実行する場合
   docker compose up -d
   ```

   停止は `down`、ボリューム削除は `down -v` です。

## バックエンド Makefile との関係

- ルートの `docker-compose.yml` を参照するよう変更しました。`apps/backend/Makefile` の `db-up`/`db-down` はそちらを呼び出します。本ファイルは DB 単体を起動したい場合にのみ直接利用してください。

## Studio へのアクセス

- Compose 起動後、`http://localhost:54323`（デフォルト）で Supabase Studio にアクセスできます。
- 初回ログイン時はメール・パスワードの入力が求められます。必要に応じて `.env` で `STUDIO_EMAIL` などを指定してください。

## 注意点

- コンテナ間ネットワークや永続化ボリュームは Compose のデフォルト設定を利用しています。設定を変更した場合はバックエンド側の接続文字列（`.env` の `DATABASE_URL`）も合わせて更新してください。
- バックエンドの `make migrate` / `make db-init` は既定でローカル Docker DSN（`postgres://postgres:postgres@localhost:5432/app?sslmode=disable`）に適用します。別環境へ適用したい場合は `MIGRATE_DATABASE_URL` を明示的に上書きしてください。
- 本番環境の構築はこの構成ではカバーしていません。将来的にクラウドへデプロイする場合は `infra/` など別ディレクトリに IaC 定義を追加してください。

## 開発時の流れ

1. `make backend` または `make -C apps/backend db-up` でコンテナを起動します。
2. `make backend-db-init`（ルート）または `make -C apps/backend db-init` で最新のマイグレーションを適用し、スキーマを同期させます。
3. 初期データが必要であれば、`apps/backend` 側で用意したシードスクリプトや SQL を実行します（未整備の場合は任意のタイミングで追加してください）。
4. 開発セッション終了時は `make -C apps/backend db-down` で停止し、不要になったら `destroy` でボリュームを削除します。
