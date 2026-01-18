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

- **ロジックは `packages/` に配置**: ビジネスロジック、ユーティリティ、型定義、バリデーション等は全て `packages/` に置く
- **`apps/` にはUIとプラットフォーム固有コードのみ**: コンポーネント、画面、ナビゲーション、AsyncStorage等のプラットフォーム依存のみ
- **DRY原則**: mobile/web で重複コードを見つけたら即座に `packages/` に抽出
- **後方互換**: 元ファイルは再エクスポートに変更し、既存importを壊さない

```
packages/          → ロジック（共通で使える全てのコード）
apps/mobile/       → UI + React Native固有コード
apps/web/          → UI + Next.js固有コード
apps/backend/      → APIサーバ
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
make test                       # 全体テスト（Turbo経由）
make typecheck                  # 型チェック（Turbo経由）
make lint                       # Lint実行
pnpm format                     # フォーマット修正
pnpm format:check               # フォーマットチェック

# セットアップ
make install                    # 依存関係インストール

# 開発サーバ
make dev                        # DB + backend + mobile 同時起動
make mobile                     # モバイルのみ
make web                        # Webのみ
make backend                    # バックエンドのみ

# 個別テスト
make test-mobile                # モバイルのみ
make test-web                   # Webのみ
make test-backend               # バックエンドのみ (Go)
pnpm --filter @team/* test      # パッケージ単体テスト

# Lint修正
pnpm lint:fix                   # 自動修正
```

### Turborepo

本プロジェクトは **Turborepo** を使用してタスク実行を最適化。

```bash
# キャッシュを無効化して実行
turbo run build --force

# 特定パッケージのみ実行
turbo run build --filter=@team/core-utils
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

- [docs/development.md](docs/development.md) - 詳細な開発ガイド
- [docs/screen-flow.md](docs/screen-flow.md) - 画面遷移図
- [apps/backend/README.md](apps/backend/README.md) - バックエンド詳細
- [apps/mobile/README.md](apps/mobile/README.md) - モバイル詳細
