# 開発ガイド

## CI/CD

### トリガー

- `main` / `develop` への push
- `main` / `develop` への pull request

### ローカルで CI 相当のチェックを実行

```bash
# フロントエンドテスト
pnpm --filter web test                    # Web アプリのテスト
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

# バックエンドテスト（リポジトリルートから実行可能）
make test

# または apps/backend ディレクトリで直接実行
# cd apps/backend
# go test -v -race -cover -count=1 ./...

# 依存関係セキュリティ監査
pnpm audit --audit-level moderate

# Go セキュリティチェック
go install github.com/securego/gosec/v2/cmd/gosec@latest
gosec ./...
```

## 環境変数

### 必要なバージョン

| 変数           | 値       |
| -------------- | -------- |
| `NODE_VERSION` | `24.x`   |
| `GO_VERSION`   | `1.24.0` |

### 注意点

- `.env` ファイルは Git 管理対象外
- 本番環境の値は GitHub Secrets で管理

## 初期セットアップ

### 1. 環境変数を設定

```bash
cp .env.example .env
cp apps/backend/.env.example apps/backend/.env
cp apps/mobile/.env.example apps/mobile/.env
# 各 .env ファイルを編集して必要な値を設定
```

### 2. golang-migrate のインストール

マイグレーション実行には `golang-migrate` が必要。

```bash
go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest
```

インストール後、`$HOME/go/bin` が PATH に含まれていることを確認する。

```bash
export PATH=$PATH:$HOME/go/bin
```

永続化する場合は `~/.bashrc` または `~/.zshrc` に追加する。

### 3. データベース起動 + マイグレーション

```bash
make db-migrate    # DB 起動 + マイグレーション実行
```

以下のコンテナが起動します：

| コンテナ名        | 説明                    | ポート |
| ----------------- | ----------------------- | ------ |
| tp-local-postgres | PostgreSQL データベース | 5432   |
| tp-pgadmin        | PostgreSQL 管理UI       | 5050   |

### 4. 開発サーバー起動

```bash
make dev        # DB + backend + mobile 同時起動
# または個別に起動
make backend    # バックエンドのみ
make mobile     # モバイルのみ
make web        # Web のみ
```

backend 起動後のコンテナ：

| コンテナ名 | 説明                    | ポート |
| ---------- | ----------------------- | ------ |
| tp-backend | Go バックエンドサーバー | 8080   |

### 5. 接続確認

```bash
# バックエンドヘルスチェック
curl http://localhost:8080/health
# 期待する応答: {"status":"ok"}

# API エンドポイント確認
curl http://localhost:8080/api/stores
```

## フロントエンド・バックエンド接続

### API ベース URL

| 環境          | 環境変数                   | デフォルト値                |
| ------------- | -------------------------- | --------------------------- |
| Web (Next.js) | `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8080/api` |
| Mobile (Expo) | `EXPO_PUBLIC_API_BASE_URL` | `http://localhost:8080/api` |

### 共有パッケージ

フロントエンドは `@team/api` パッケージを使用してバックエンドと通信します。

```
packages/api/        # API クライアント
packages/constants/  # 定数（DEFAULT_API_BASE_URL など）
packages/types/      # 型定義
```

## 開発時の補足

- Expo は Dev Client 前提
- ポート競合時はログを確認して手動停止
- Docker DB が起動していないと backend は起動不可
- マイグレーション未実行時は API が 500 エラーを返す
