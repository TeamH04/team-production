# team-production モノレポ

## 概要

- モバイル (Expo) とバックエンド (Go) をまとめたモノレポ構成です。
- 依存関係は pnpm ワークスペースで管理し、`Makefile` に共通コマンドをまとめています。

## ディレクトリ

| パス | 説明 |
| --- | --- |
| `apps/mobile` | Expo + React Native クライアント。`README.md` で詳細を管理。 |
| `apps/backend` | Go 製 API。`README.md` でセットアップやコマンドを記載。 |
| `infra/supabase` | ローカル DB 用の Docker Compose 定義。 |
| `docs/` | アーキテクチャ資料などのドキュメント。 |

## セットアップ

1. Node.js 20 系、Go 1.23 以降、Docker (Compose v2) をインストールします。
2. ルートで以下を実行して依存関係を揃えます。

   ```bash
   corepack enable pnpm
   pnpm install
   ```

3. 各アプリケーションの `.env.example` を `.env` にコピーし、必要な値を設定します。

## コマンド

| コマンド | 説明 |
| --- | --- |
| `make install` | pnpm ワークスペース全体の依存をインストール |
| `make backend` | DB 起動 + Go サーバー起動 (`apps/backend`) |
| `make backend-db-up` / `make backend-db-down` | DB スタックの起動 / 停止 |
| `make backend-test` | Go のユニットテスト実行 |
| `make frontend` | Expo Dev Server を起動 (`apps/mobile`) |
| `make dev` | バックエンド + Expo を同時起動 (ポート競合時はログを確認して中断してください) |

## ドキュメント

- バックエンドの詳細は `apps/backend/README.md`
- モバイルの詳細は `apps/mobile/README.md`
- 全体設計は `docs/` 配下を参照してください。

## 運用メモ

- `make dev` など常駐コマンドは長時間ブロックする場合があります。数分反応が無い場合は停止し、ログ・ポートを確認してください。
- Windows 環境では Go 実行ファイルや Expo のポートを自動検出するようにしていますが、問題がある場合は README の手順に従い上書き設定してください。
