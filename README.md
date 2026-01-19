# team-production

モバイル・Web・バックエンドのモノレポ

## 技術スタック

| レイヤー | 技術                |
| -------- | ------------------- |
| Mobile   | Expo + React Native |
| Web      | Next.js             |
| Backend  | Go + Echo           |
| DB       | PostgreSQL          |
| ビルド   | Turborepo + pnpm    |

## セットアップ

### 前提条件

- Node.js 24系
- Go 1.25+
- Docker

### 手順

```bash
# 1. クローン & インストール
git clone <repo>
cd team-production
make install

# 2. 環境変数をコピー
cp .env.example .env
cp apps/backend/.env.example apps/backend/.env
cp apps/mobile/.env.example apps/mobile/.env

# 3. DB起動 & マイグレーション
make db-migrate

# 4. 開発サーバー起動
make dev

# 5. 動作確認
curl http://localhost:8080/health
# → {"status":"ok"}
```

> Windows: WSL2推奨。詳細は [docs/windows-setup.md](docs/windows-setup.md)

## コマンド早見表

### 日常作業

| やりたいこと             | コマンド                   |
| ------------------------ | -------------------------- |
| 開発サーバー起動（全部） | `make dev`                 |
| バックエンドだけ起動     | `make backend` or `make b` |
| モバイルだけ起動         | `make mobile` or `make m`  |
| Webだけ起動              | `make web` or `make w`     |
| テスト実行               | `make test`                |
| 型チェック               | `make typecheck`           |
| Lint                     | `make lint`                |
| フォーマット修正         | `pnpm format`              |

### DB操作

| やりたいこと              | コマンド          |
| ------------------------- | ----------------- |
| DB起動 + マイグレーション | `make db-migrate` |
| DB停止                    | `make db-stop`    |
| DBリセット（データ削除）  | `make db-reset`   |
| DB完全削除                | `make db-destroy` |

### ビルド

| やりたいこと       | コマンド                     |
| ------------------ | ---------------------------- |
| 全アプリビルド     | `make build`                 |
| 新規パッケージ作成 | `pnpm create-package <name>` |

### Goバックエンド専用

| やりたいこと       | コマンド                     |
| ------------------ | ---------------------------- |
| lint実行           | `make -C apps/backend lint`  |
| フォーマット       | `make -C apps/backend fmt`   |
| ツールインストール | `make -C apps/backend tools` |

**全コマンド一覧**: `make help`

## ディレクトリ構成

```
apps/
├── backend/     # Go API サーバー (port 8080)
├── mobile/      # Expo + React Native
└── web/         # Next.js

packages/        # 共有パッケージ (@team/*)
docs/            # ドキュメント
```

## 起動後のポート

| サービス      | ポート | URL                   |
| ------------- | ------ | --------------------- |
| Backend API   | 8080   | http://localhost:8080 |
| PostgreSQL    | 5432   | -                     |
| pgAdmin       | 5050   | http://localhost:5050 |
| Expo (Metro)  | 8081   | -                     |
| Web (Next.js) | 3000   | http://localhost:3000 |

## ドキュメント

- [詳細セットアップ](docs/setup.md) - トラブルシューティング含む
- [コマンドリファレンス](docs/commands.md) - 全コマンド詳細
- [共有パッケージ](docs/packages.md) - @team/\* の使い方
- [API設計](docs/specs/api.md)
- [DB設計](docs/specs/database.md)
