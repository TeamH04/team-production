# team-production モノレポ

## 概要

- モバイル（Expo）とバックエンド（Go）を一体管理するモノレポ
- パッケージ管理：pnpm
- 共通タスク：Makefile 経由で提供

---

## 前提条件

- Node.js 20 系
- Go 1.23 以上（CI では 1.24.0）
- Docker（Compose v2）
- Windows の場合：Git Bash（MINGW64）

---

## ディレクトリ構成

| パス           | 説明                             |
| -------------- | -------------------------------- |
| `apps/mobile`  | Expo + React Native クライアント |
| `apps/backend` | Go 製 API サーバ                 |
| `supabase`     | ローカル DB 用 Docker Compose    |
| `docs/`        | アーキテクチャ・運用ノート       |

---

## セットアップ

1. 依存ツールをインストール
   - Node.js / Go / Docker を事前に用意

2. 依存関係をインストール

   ```bash
   corepack enable pnpm
   pnpm install
   ```

3. 環境変数を設定
   - 各アプリの `.env.example` を `.env` にコピー
   - 必要な値を入力

4. Windows の注意
   - `make` は Git Bash から実行
   - PowerShell / cmd は一部非対応

---

## 主なコマンド

| コマンド               | 説明                             |
| ---------------------- | -------------------------------- |
| `make install`         | 全ワークスペース依存インストール |
| `make backend`         | DB 起動 + Go サーバ起動          |
| `make backend-db-up`   | DB 起動                          |
| `make backend-db-down` | DB 停止                          |
| `make backend-db-init` | マイグレーション適用             |
| `make backend-test`    | Go テスト                        |
| `make frontend`        | Expo Dev Client 起動             |
| `make dev`             | フロント + バック同時起動        |

---

## 画面と機能

### モバイル（apps/mobile）

- 店舗閲覧
- お気に入り管理
- レビュー投稿
- ユーザー管理

### バックエンド（apps/backend）

- 認証・認可 API
- 店舗・レビュー CRUD
- ユーザーデータ管理

---

## CI/CD

### トリガー

- `main` / `develop` への push
- `main` / `develop` への pull request

### ローカル実行コマンド

```bash
# フロントエンドテスト
pnpm --filter web test                    # Webアプリのテスト
pnpm --filter mobile test                 # モバイルアプリのテスト
pnpm --filter web --filter mobile test    # Web・モバイル同時実行

# Lint
pnpm run lint

# フォーマットチェック
pnpm run format:check

# フォーマット修正
pnpm run format

# モバイル専用フォーマット
pnpm run format:mobile

# バックエンドテスト
cd apps/backend
go test -v -race -cover -coverprofile=coverage.out -count=1 ./...

# 依存関係セキュリティ監査
pnpm audit --audit-level moderate

# Go セキュリティチェック
go install github.com/securego/gosec/v2/cmd/gosec@latest
gosec ./...
```

---

## 環境変数

### 最低限

- `NODE_VERSION=20.x`
- `GO_VERSION=1.24.0`

### 注意点

- `.env` は Git 管理対象外
- 本番値は GitHub Secrets で管理

---

## 開発時の補足

- Expo は Dev Client 前提
- ポート競合時はログを確認して手動停止
- Docker DB が起動していないと backend は起動不可

---

## ドキュメント参照先

- バックエンド: `apps/backend/README.md`
- モバイル: `apps/mobile/README.md`
- 開発補足: `docs/`
