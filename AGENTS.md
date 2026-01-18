# AGENTS.md

AIコーディングエージェント向けのプロジェクトガイドライン。

---

## Project Overview

店舗検索・管理プラットフォームのモノレポ。神戸エリアの店舗情報を提供する。

- **Mobile**: Expo + React Native（メインクライアント）
- **Web**: Next.js（Webアプリ）
- **Backend**: Go（APIサーバ）
- **DB**: PostgreSQL + Supabase
- **Build System**: Turborepo（キャッシュ・並列実行）
- **Package Manager**: pnpm

---

## Project Structure

```
team-production/
├── apps/
│   ├── mobile/     # Expo + React Native
│   ├── web/        # Next.js
│   └── backend/    # Go API サーバ
├── packages/       # 共有パッケージ (@team/*)
├── docs/           # ドキュメント
└── supabase/       # Supabase 設定
```

---

## Shared Packages

共通ロジックは `packages/` に抽出し、mobile/web 両方から利用する。

| Package                | Description                                      |
| ---------------------- | ------------------------------------------------ |
| `@team/api`            | APIクライアント、エンドポイント定義              |
| `@team/constants`      | 共通定数、エラーメッセージ、バリデーションルール |
| `@team/core-utils`     | 認証ヘルパー、日付フォーマット等                 |
| `@team/crypto-utils`   | 暗号化ユーティリティ                             |
| `@team/hooks`          | 共通React Hooks                                  |
| `@team/location-utils` | 駅エリアデータ、座標計算                         |
| `@team/mobile-ui`      | モバイル専用UIコンポーネント                     |
| `@team/shop-core`      | 店舗コアロジック、型定義                         |
| `@team/test-utils`     | テストユーティリティ                             |
| `@team/theme`          | テーマ・色定義                                   |
| `@team/types`          | 共通型定義                                       |
| `@team/validators`     | バリデーションロジック                           |

### Code Sharing Guidelines

**原則: 統一できるものは全て `packages/` に作成する**

- **`apps/mobile/` と `apps/web/` にはプラットフォーム固有コードのみ配置**
  - Expo / React Native 固有のAPI（AsyncStorage, Linking, etc.）
  - Next.js 固有のAPI（next/router, next/image, SSR, etc.）
  - プラットフォーム固有のUIコンポーネント
  - 画面コンポーネント、ナビゲーション設定
- **共通化できるロジックは全て `packages/` に配置**
  - ビジネスロジック、ユーティリティ関数
  - 型定義、バリデーションルール
  - React Hooks（プラットフォーム非依存のもの）
  - 定数、設定値
- **DRY原則**: mobile/web で重複コードを見つけたら即座に `packages/` に抽出
- **後方互換**: 元ファイルは再エクスポートに変更し、既存importを壊さない

```
packages/          → 共通ロジック（統一できる全てのコード）
apps/mobile/       → Expo/React Native 固有のUI・ロジックのみ
apps/web/          → Next.js 固有のUI・ロジックのみ
apps/backend/      → Go APIサーバ
```

### 新規パッケージの作成

```bash
# 基本パッケージ
pnpm create-package <package-name>

# テスト付きパッケージ
pnpm create-package <package-name> --with-test

# 例
pnpm create-package date-utils --with-test
```

生成後、`pnpm install` を実行してワークスペースを更新。

---

## Build & Test Commands

```bash
# テスト・品質チェック（最頻出）
make test                       # 全体テスト
make typecheck                  # 型チェック（Turbo経由）
make lint                       # Lint実行
pnpm format                     # フォーマット修正
pnpm format:check               # フォーマットチェック

# セットアップ
make install                    # 依存関係インストール + Git hooks設定

# DB操作
make db-migrate                 # DB起動 + マイグレーション
make db-start                   # DB起動のみ
make db-stop                    # DB停止
make db-reset                   # DBリセット（drop + migrate）
make db-destroy                 # DB完全削除（ボリューム含む）

# 開発サーバ
make dev                        # DB + backend + mobile 同時起動
make mobile   # or make m       # モバイルのみ
make web      # or make w       # Webのみ
make backend  # or make b       # バックエンドのみ

# 個別テスト
make test-mobile                # モバイルのみ
make test-web                   # Webのみ
make test-backend               # バックエンドのみ (Go)
pnpm --filter @team/* test      # パッケージ単体テスト

# Lint修正
pnpm lint:fix                   # 自動修正

# ビルド
make build                      # 全アプリビルド
make clean                      # ビルド成果物削除

# ヘルプ
make help                       # 全コマンド一覧
```

### 直接コマンド（make なしで実行）

LLM agent が直接実行する場合:

```bash
# Backend (Go) - apps/backend で実行
go test ./...                              # テスト
go test -v ./internal/handlers/...         # 特定パッケージのテスト
go run ./cmd/server                        # サーバー起動
go build ./...                             # ビルド
go mod tidy                                # 依存整理
golangci-lint run                          # Lint
gofumpt -w .                               # フォーマット

# Mobile - リポジトリルートで実行
pnpm --dir apps/mobile test                # テスト
pnpm --dir apps/mobile start               # Expo 起動
pnpm --dir apps/mobile android             # Android 起動
pnpm --dir apps/mobile ios                 # iOS 起動

# Web - リポジトリルートで実行
pnpm --dir apps/web test                   # テスト
pnpm --dir apps/web dev                    # 開発サーバー
pnpm --dir apps/web build                  # ビルド

# Packages - リポジトリルートで実行
pnpm --dir packages/core-utils test        # 特定パッケージのテスト
pnpm --dir packages/validators test

# 全体
pnpm test                                  # 全テスト
pnpm typecheck                             # 型チェック
pnpm lint                                  # Lint
pnpm lint:fix                              # Lint + 自動修正
pnpm format                                # フォーマット
pnpm format:check                          # フォーマットチェック

# DB (Docker)
docker compose up -d postgres pgadmin      # DB起動
docker compose down                        # DB停止
```

### Turborepo

本プロジェクトは **Turborepo** を使用してタスク実行を最適化。

```bash
# キャッシュを無効化して実行
turbo run build --force

# 特定パッケージのみ実行
turbo run build --filter=@team/core-utils
turbo run test --filter=@team/validators
```

---

## Code Style Guidelines

- **ESLint**: ルートの `eslint.config.js` を基準
- **Prettier**: `.prettierrc` に従う
- **eslint-disable**: 原則禁止。必要なら設定変更と理由を明記
- **React Hooks**: `exhaustive-deps` に従い依存配列を正しく設定
- **スタイル**: インラインスタイル・カラーコード直書き禁止
- **色定義**: `packages/theme/src/colors.ts` が正解

---

## Backend (Go) Guidelines

### 定数の使用

文字列リテラルの直書きを避け、定義済み定数を使用する。

```go
// ロール定数 - "user", "owner", "admin" を直書きしない
import "github.com/TeamH04/team-production/apps/backend/internal/domain/role"

role.User              // "user"
role.Owner             // "owner"
role.Admin             // "admin"
role.OwnerOrAdmin      // []string{"owner", "admin"}

// エラーメッセージ定数 (handlers/http_helpers.go)
handlers.ErrMsgInvalidJSON      // "invalid JSON"
handlers.ErrMsgInvalidStoreID   // "invalid store id"
handlers.ErrMsgInvalidReviewID  // "invalid review id"

// エンドポイントパス定数 (router/endpoints.go)
router.StoresPath, router.StoreByIDPath, router.HealthPath, etc.

// 時間定数 (config/constants.go)
config.SignedURLTTL  // 15 * time.Minute
```

### ハンドラーのヘルパー関数

handlers パッケージ内では共通ヘルパー関数を使用する。

```go
// 推奨: ヘルパー関数を使用
user, err := getRequiredUser(c)
if err := bindJSON(c, &dto); err != nil { return err }
id, err := parseUUIDParam(c, "id", ErrMsgInvalidStoreID)

// 非推奨: 直接呼び出し
requestcontext.GetUserFromContext(c.Request().Context())  // NG
c.Bind(&dto)                                               // NG
```

### HTTPエラー判定

ステータスコードのエラー判定には定数を使用する。

```go
import infrahttp "github.com/TeamH04/team-production/apps/backend/internal/infra/http"

// 推奨
if infrahttp.IsHTTPError(resp.StatusCode) { ... }

// 非推奨: マジックナンバー
if resp.StatusCode >= 300 { ... }  // NG
```

### テストユーティリティ

テストでは `handlers/testutil` パッケージのヘルパーとモックを使用する。

```go
import "github.com/TeamH04/team-production/apps/backend/internal/handlers/testutil"

// ポインタヘルパー
testutil.StringPtr("value")
testutil.IntPtr(100)

// テストコンテキスト
tc := testutil.NewTestContextWithJSON(http.MethodPost, "/path", jsonBody)
tc := testutil.NewTestContextNoBody(http.MethodGet, "/path")

// モック
testutil.MockStorageProvider{}
testutil.MockMenuUseCase{}
testutil.MockStoreUseCase{}
```

### セキュリティ

- **ログインジェクション対策**: ユーザー入力をログ出力する際は `sanitizeLogInput()` で改行文字を除去（CWE-117）
- **入力バリデーション**: UUID パラメータは `parseUUIDParam()` で検証
- **認証チェック**: `getRequiredUser()` で認証済みユーザーを取得

---

## Commit Message Guidelines

```
<type>(<scope>): <subject>

<body>

Co-Authored-By: <name> <email>
```

### Types

| Type       | Description      |
| ---------- | ---------------- |
| `feat`     | 新機能           |
| `fix`      | バグ修正         |
| `refactor` | リファクタリング |
| `docs`     | ドキュメント     |
| `test`     | テスト追加・修正 |
| `chore`    | ビルド・設定変更 |

### Scope Examples

`mobile`, `web`, `backend`, `api`, `hooks`, `validators`, etc.

### Examples

```
feat(mobile): 店舗お気に入り機能を追加
fix(api): 認証トークン更新時のエラーを修正
refactor(hooks): useShopFilterをpackagesに抽出
```

---

## Pull Request Guidelines

1. `main` から `feature/*` ブランチを作成
2. PR前に必ず実行: `pnpm lint && make typecheck && make test`
3. マージには最低1名の承認 (LGTM) が必要
4. PRタイトルはコミットメッセージ形式に従う

### PR Description Template

```markdown
## Summary

- 変更内容の概要

## Test Plan

- [ ] テスト項目1
- [ ] テスト項目2
```

---

## Security Considerations

- **OWASP Top 10** に注意（XSS, SQL Injection, Command Injection等）
- `.env` ファイルをコミットしない
- APIキー・シークレットはハードコードしない
- ユーザー入力は必ずバリデーション

---

## Deployment

```bash
# 本番ビルド（Turbo経由）
make build

# モバイル (EAS Build)
cd apps/mobile && eas build --platform ios
cd apps/mobile && eas build --platform android

# Web (Vercel)
cd apps/web && vercel --prod

# Backend
cd apps/backend && go build -o server ./cmd/api
```

---

## Environment Variables

各アプリに `.env.example` を `.env` としてコピー:

```bash
cp .env.example .env
cp apps/backend/.env.example apps/backend/.env
cp apps/mobile/.env.example apps/mobile/.env
```

**注意**: `EXPO_PUBLIC_WEB_BASE_URL` の末尾にスラッシュを入れない

---

## Troubleshooting

| Issue                    | Solution                             |
| ------------------------ | ------------------------------------ |
| パッケージが見つからない | `pnpm install` を実行                |
| 型エラー                 | `make typecheck` で確認              |
| Lintエラー               | `pnpm lint:fix` で自動修正           |
| turbo: not found         | `pnpm install` でturboをインストール |
| DB接続エラー             | `make db-start` でDB起動             |
| ポート競合               | 既存プロセスを終了してから再起動     |

---

## Additional Resources

- [docs/setup.md](docs/setup.md) - 詳細セットアップガイド
- [docs/commands.md](docs/commands.md) - コマンドリファレンス
- [docs/packages.md](docs/packages.md) - 共有パッケージガイド
- [docs/specs/api.md](docs/specs/api.md) - API設計書
- [docs/specs/database.md](docs/specs/database.md) - DB設計書
- [docs/specs/screen-flow.md](docs/specs/screen-flow.md) - 画面遷移図
- [docs/specs/backend-architecture.md](docs/specs/backend-architecture.md) - バックエンドアーキテクチャ
