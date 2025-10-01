# Supabase ローカル環境

## 概要

`docker-compose.yml` で Supabase エコシステム（PostgreSQL、Realtime、Auth、Studio など）をまとめて起動します。バックエンド API (`apps/backend`) のローカル開発ならびに動作確認向けの最小構成です。

## セットアップ

1. 必要に応じて `.env.example` をコピーして `.env` を作成します。

   ```bash
   cp .env.example .env
   ```

   - `POSTGRES_PASSWORD` やポート設定を変更したい場合に編集してください。空のままでも Compose が起動します。
2. リポジトリのルートまたはこのディレクトリで以下を実行します。

   ```bash
   docker compose -f infra/supabase/docker-compose.yml up -d
   ```

   停止は `down`、ボリューム削除は `down -v` です。

## バックエンド Makefile との関係

- `apps/backend/Makefile` の `run-dev`, `db-up`, `db-down`, `destroy` ターゲットがこの Compose ファイルを参照します。バックエンド開発では Makefile 経由での操作を推奨します。

## Studio へのアクセス

- Compose 起動後、`http://localhost:54323`（デフォルト）で Supabase Studio にアクセスできます。
- 初回ログイン時はメール・パスワードの入力が求められます。必要に応じて `.env` で `STUDIO_EMAIL` などを指定してください。

## 注意点

- コンテナ間ネットワークや永続化ボリュームは Compose のデフォルト設定を利用しています。設定を変更した場合はバックエンド側の接続文字列（`.env` の `DATABASE_URL`）も合わせて更新してください。
- 本番環境の構築はこの構成ではカバーしていません。将来的にクラウドへデプロイする場合は `infra/` 配下に新しい IaC 定義を追加してください。

## 開発時の流れ

1. `make backend` または `make -C apps/backend db-up` でコンテナを起動します。
2. `make -C apps/backend migrate` で最新のマイグレーションを適用し、スキーマを同期させます。
3. 初期データが必要であれば、`apps/backend` 側で用意したシードスクリプトや SQL を実行します（未整備の場合は任意のタイミングで追加してください）。
4. 開発セッション終了時は `make -C apps/backend db-down` で停止し、不要になったら `destroy` でボリュームを削除します。
