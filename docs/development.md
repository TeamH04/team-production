# 開発ガイド

## よく使うコマンド

### テスト・品質チェック

```bash
# テスト実行
make test                        # 全テスト（backend + web + mobile）
pnpm test                        # フロントエンドのみ（Turbo経由）
pnpm --dir apps/web test         # Webのみ
pnpm --dir apps/mobile test      # モバイルのみ

# 型チェック（Turboキャッシュ有効）
make typecheck
pnpm typecheck

# Lint
make lint
pnpm lint
pnpm lint:fix                    # 自動修正

# フォーマット
pnpm format:check                # チェックのみ
pnpm format                      # 自動修正
```

### 開発サーバー

```bash
# 全体起動（推奨）
make dev                         # DB + backend + mobile 同時起動

# 個別起動
make backend                     # バックエンドのみ
make mobile                      # モバイルのみ（または make m）
make web                         # Webのみ（または make w）

# pnpm経由
pnpm dev                         # モバイル起動
pnpm dev:tunnel                  # モバイル起動（トンネルモード）
pnpm dev:web                     # Web起動
```

### ビルド

```bash
make build                       # 全アプリビルド
pnpm build                       # フロントエンドのみ（Turbo経由）
```

---

## ビルドシステム（Turborepo）

本プロジェクトは **Turborepo** を使用してタスク実行を最適化しています。

### Turbo対応コマンド一覧

| コマンド         | 説明                     | キャッシュ |
| ---------------- | ------------------------ | ---------- |
| `pnpm build`     | 全パッケージのビルド     | ✅         |
| `pnpm test`      | 全パッケージのテスト     | -          |
| `pnpm typecheck` | 全パッケージの型チェック | ✅         |
| `pnpm lint:apps` | apps専用lint             | ✅         |

### キャッシュ制御

```bash
# キャッシュを無効化して実行
turbo run build --force

# 特定パッケージのみ実行
turbo run build --filter=@team/core-utils
```

---

## CI/CD

### トリガー

- `main` / `develop` への push
- `main` / `develop` への pull request

### ローカルでCI相当のチェック

```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test
```

### セキュリティ監査

```bash
# npm依存関係
pnpm audit --audit-level moderate

# Go
go install github.com/securego/gosec/v2/cmd/gosec@latest
gosec ./...
```

---

## 共有パッケージ

### パッケージ一覧

| パッケージ             | 説明                     | テスト |
| ---------------------- | ------------------------ | ------ |
| `@team/api`            | APIクライアント          | -      |
| `@team/constants`      | 共通定数                 | -      |
| `@team/types`          | 型定義                   | -      |
| `@team/validators`     | バリデーション           | -      |
| `@team/hooks`          | Reactフック              | -      |
| `@team/core-utils`     | コアユーティリティ       | ✅     |
| `@team/crypto-utils`   | 暗号化ユーティリティ     | ✅     |
| `@team/location-utils` | 位置情報ユーティリティ   | ✅     |
| `@team/shop-core`      | 店舗関連ロジック         | ✅     |
| `@team/mobile-ui`      | モバイルUIコンポーネント | -      |
| `@team/theme`          | テーマ定義               | -      |
| `@team/test-utils`     | テストユーティリティ     | -      |

### 新規パッケージの作成

```bash
# 基本パッケージ
pnpm create-package <package-name>

# テスト付きパッケージ
pnpm create-package <package-name> --with-test

# 例
pnpm create-package date-utils --with-test
```

生成後、`pnpm install` を実行してワークスペースを更新してください。

### パッケージ構造（標準テンプレート）

```
packages/<package-name>/
├── package.json      # 標準化された設定
├── tsconfig.json     # 共通設定を継承
└── src/
    ├── index.ts      # エントリーポイント
    └── __tests__/    # テストディレクトリ（--with-test時）
```

---

## 初期セットアップ

### 1. 依存関係インストール

```bash
make install
```

### 2. 環境変数を設定

```bash
cp .env.example .env
cp apps/backend/.env.example apps/backend/.env
cp apps/mobile/.env.example apps/mobile/.env
# 各 .env ファイルを編集して必要な値を設定
```

### 3. golang-migrate のインストール

マイグレーション実行には `golang-migrate` が必要。

```bash
go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest
export PATH=$PATH:$HOME/go/bin
```

永続化する場合は `~/.bashrc` または `~/.zshrc` に追加する。

### 4. データベース起動 + マイグレーション

```bash
make db-migrate
```

以下のコンテナが起動します：

| コンテナ名        | 説明                    | ポート |
| ----------------- | ----------------------- | ------ |
| tp-local-postgres | PostgreSQL データベース | 5432   |
| tp-pgadmin        | PostgreSQL 管理UI       | 5050   |

### 5. 開発サーバー起動

```bash
make dev
```

backend 起動後のコンテナ：

| コンテナ名 | 説明                    | ポート |
| ---------- | ----------------------- | ------ |
| tp-backend | Go バックエンドサーバー | 8080   |

### 6. 接続確認

```bash
curl http://localhost:8080/health
# 期待する応答: {"status":"ok"}
```

---

## 環境変数

### 必要なバージョン

| 変数           | 値       |
| -------------- | -------- |
| `NODE_VERSION` | `24.x`   |
| `GO_VERSION`   | `1.24.0` |

### 注意点

- `.env` ファイルは Git 管理対象外
- 本番環境の値は GitHub Secrets で管理

### API ベース URL

| 環境          | 環境変数                   | デフォルト値                |
| ------------- | -------------------------- | --------------------------- |
| Web (Next.js) | `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8080/api` |
| Mobile (Expo) | `EXPO_PUBLIC_API_BASE_URL` | `http://localhost:8080/api` |

---

## 開発時の補足

- Expo は Dev Client 前提
- ポート競合時はログを確認して手動停止
- Docker DB が起動していないと backend は起動不可
- マイグレーション未実行時は API が 500 エラーを返す
