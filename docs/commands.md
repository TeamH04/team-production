# コマンドリファレンス

## make コマンド一覧

### 開発サーバー

| コマンド       | 短縮形   | 説明                             |
| -------------- | -------- | -------------------------------- |
| `make dev`     | -        | DB + backend + mobile を同時起動 |
| `make backend` | `make b` | バックエンドのみ起動             |
| `make mobile`  | `make m` | モバイルのみ起動                 |
| `make web`     | `make w` | Webのみ起動                      |

### セットアップ

| コマンド          | 説明                                 |
| ----------------- | ------------------------------------ |
| `make install`    | 依存関係インストール + Git hooks設定 |
| `make db-start`   | PostgreSQL + pgAdmin 起動            |
| `make db-stop`    | PostgreSQL + pgAdmin 停止            |
| `make db-migrate` | DB起動 + マイグレーション実行        |
| `make db-reset`   | DBをリセット（drop + migrate）       |
| `make db-destroy` | DB完全削除（ボリューム含む）         |

### 品質チェック

| コマンド            | 説明                                   |
| ------------------- | -------------------------------------- |
| `make test`         | 全テスト実行（backend + web + mobile） |
| `make test-backend` | バックエンドテストのみ                 |
| `make test-web`     | Webテストのみ                          |
| `make test-mobile`  | モバイルテストのみ                     |
| `make typecheck`    | TypeScript 型チェック                  |
| `make lint`         | ESLint + golangci-lint                 |

### ビルド

| コマンド     | 説明             |
| ------------ | ---------------- |
| `make build` | 全アプリビルド   |
| `make clean` | ビルド成果物削除 |

---

## pnpm コマンド一覧

### 開発

| コマンド          | 説明                       |
| ----------------- | -------------------------- |
| `pnpm dev`        | モバイル開発サーバー起動   |
| `pnpm dev:tunnel` | モバイル（トンネルモード） |
| `pnpm dev:web`    | Web開発サーバー起動        |

### 品質チェック

| コマンド            | 説明                              |
| ------------------- | --------------------------------- |
| `pnpm test`         | 全テスト実行                      |
| `pnpm typecheck`    | 型チェック（Turboキャッシュ有効） |
| `pnpm lint`         | ESLint実行                        |
| `pnpm lint:fix`     | ESLint + 自動修正                 |
| `pnpm format`       | Prettier フォーマット修正         |
| `pnpm format:check` | Prettier チェックのみ             |

### ビルド・その他

| コマンド                     | 説明                         |
| ---------------------------- | ---------------------------- |
| `pnpm build`                 | 全パッケージビルド（Turbo）  |
| `pnpm clean`                 | キャッシュ・ビルド成果物削除 |
| `pnpm create-package <name>` | 新規パッケージ作成           |
| `pnpm android`               | Android ビルド・実行         |
| `pnpm ios`                   | iOS ビルド・実行             |

---

## Go（backend）コマンド

`apps/backend` ディレクトリで実行:

| コマンド     | 説明                                  |
| ------------ | ------------------------------------- |
| `make serve` | サーバーをローカル実行                |
| `make tools` | golangci-lint, gofumpt をインストール |
| `make lint`  | golangci-lint 実行                    |
| `make fmt`   | gofumpt でフォーマット                |
| `make test`  | テスト実行（カバレッジ付き）          |
| `make build` | ビルド                                |

または直接:

| コマンド              | 説明         |
| --------------------- | ------------ |
| `go run ./cmd/server` | サーバー実行 |
| `go test ./...`       | テスト実行   |
| `go build ./...`      | ビルド       |
| `go mod tidy`         | 依存関係整理 |

---

## Turborepo

キャッシュ有効なコマンド:

- `pnpm build`
- `pnpm typecheck`
- `pnpm lint:apps`

キャッシュを無視して実行:

```bash
turbo run build --force
```

特定パッケージのみ実行:

```bash
turbo run build --filter=@team/core-utils
```

---

## CI相当のチェック（ローカル）

```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test
```
