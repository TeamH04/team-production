# team-production モノレポ

## 概要

- モバイル (Expo) とバックエンド (Go) をまとめたモノレポ構成です。
- 依存関係は pnpm ワークスペースで管理し、`Makefile` に共通コマンドをまとめています。

## ディレクトリ
| パス           | 説明                                                         |
| -------------- | ------------------------------------------------------------ |
| `apps/mobile`  | Expo + React Native クライアント。`README.md` で詳細を管理。 |
| `apps/backend` | Go 製 API。`README.md` でセットアップやコマンドを記載。      |
| `supabase`     | ローカル DB 用の Docker Compose 定義。                       |
| `docs/`        | アーキテクチャ資料などのドキュメント。                       |

## セットアップ
1. Node.js 20 系、Go 1.23 以降、Docker (Compose v2) をインストールします。
2. ルートで以下を実行して依存関係を揃えます。

   ```bash
   corepack enable pnpm
   pnpm install
   ```

3. 各アプリケーションの `.env.example` を `.env` にコピーし、必要な値を設定します。

## コマンド

| コマンド                                      | 説明                                                                          |
| --------------------------------------------- | ----------------------------------------------------------------------------- |
| `make install`                                | pnpm ワークスペース全体の依存をインストール                                   |
| `make backend`                                | DB 起動 + Go サーバー起動 (`apps/backend`)                                    |
| `make backend-db-up` / `make backend-db-down` | DB スタックの起動 / 停止                                                      |
| `make backend-db-init`                        | ローカル Docker データベースにマイグレーション適用 (`apps/backend`)           |
| `make backend-test`                           | Go のユニットテスト実行                                                       |
| `make frontend`                               | Expo Dev Server を起動 (`apps/mobile`)                                        |
| `make dev`                                    | バックエンド + Expo を同時起動 (ポート競合時はログを確認して中断してください) |

## CI/CD

### GitHub Actions ワークフロー

プロジェクトには包括的な CI/CD パイプラインが設定されています（`.github/workflows/ci-cd.yml`）。

#### トリガー条件

- `main` または `develop` ブランチへのプッシュ
- `main` または `develop` ブランチへのプルリクエスト

#### ローカルでの CI チェック実行

CI で実行されるチェックをローカルで事前に確認できます：

```bash
# Lint チェック
pnpm run lint

# フォーマットチェック
pnpm run format:check

# フォーマット自動修正
pnpm run format

# モバイルのフォーマット
pnpm run format:mobile

# バックエンドのテスト
cd apps/backend
go test -v -race ./...

# セキュリティ監査
pnpm audit --audit-level moderate

# Go のセキュリティチェック (gosec)
cd apps/backend
go install github.com/securego/gosec/v2/cmd/gosec@latest
gosec ./...
```

#### 環境変数

CI/CD で使用される環境変数：

- `NODE_VERSION`: `20.x`
- `GO_VERSION`: `1.24.0`

#

## ドキュメント

- バックエンドの詳細は `apps/backend/README.md`
- モバイルの詳細は `apps/mobile/README.md`
