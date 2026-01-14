# team-production モノレポ

## 概要

- モバイル(Expo)とバックエンド(Go)を一体管理するモノレポです。
- パッケージ管理は pnpm、共通タスクは `Makefile` で提供しています。

## ディレクトリ

| パス           | 説明                                                            |
| -------------- | --------------------------------------------------------------- |
| `apps/mobile`  | Expo + React Native クライアント。詳細は各 `README.md` を参照。 |
| `apps/backend` | Go 製の API。セットアップとコマンドは `README.md` を参照。      |
| `supabase`     | ローカル DB 用の Docker Compose 一式。                          |
| `docs/`        | アーキテクチャや運用ノートなどのドキュメント。                  |

## セットアップ

1. Node.js 20 系、Go 1.23 以上、Docker(Compose v2) を用意します。
2. ルートで依存関係をインストールします。

   ```bash
   corepack enable pnpm
   pnpm install
   ```

3. 各アプリケーションの `.env.example` を `.env` にコピーし、必要値を設定します。
4. Windows 環境では bash 前提の Makefile を使用するため、Git Bash (MINGW64) から `make` を実行してください（PowerShell / cmd では一部ターゲットが動作しません）。

## コマンド

| コマンド                                      | 説明                                                                          |
| --------------------------------------------- | ----------------------------------------------------------------------------- |
| `make install`                                | pnpm ワークスペース全体の依存をインストール                                   |
| `make backend`                                | DB 起動 + Go サーバー起動 (`apps/backend`)                                    |
| `make backend-db-up` / `make backend-db-down` | DB スタックの起動 / 停止                                                      |
| `make backend-db-init`                        | ローカル Docker データベースにマイグレーション適用 (`apps/backend`)           |
| `make backend-test`                           | Go のユニットテスト実行                                                       |
| `make frontend`                               | Expo Dev Client を起動 (`apps/mobile`)                                        |
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
go test -v -race -cover -coverprofile=coverage.out -count=1 ./...

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

## ドキュメント

- バックエンド: `apps/backend/README.md`
- モバイル: `apps/mobile/README.md`
- Expo 開発環境の補足: `make frontend` / `make dev` は Expo Dev Client を起動します。
