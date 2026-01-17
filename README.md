# team-production モノレポ

## 概要

- モバイル（Expo）・Web（Next.js）・バックエンド（Go）を一体管理するモノレポ
- パッケージ管理：pnpm
- 共通タスク：Makefile 経由で提供

> **Windows ユーザーへ**: 本プロジェクトは POSIX 環境を前提としています。
> **WSL2 の使用を強く推奨します。** 詳細は [docs/windows-setup.md](docs/windows-setup.md) を参照してください。

---

## 前提条件

- Node.js 24 系
- Go 1.24 以上
- Docker

---

## クイックスタート

```bash
# 1. 依存関係をインストール
make install

# 2. 環境変数を設定
cp .env.example .env
cp apps/backend/.env.example apps/backend/.env
cp apps/mobile/.env.example apps/mobile/.env

# 3. DB起動 + マイグレーション
make db-migrate

# 4. 開発サーバーを起動
make dev        # DB + backend + mobile 同時起動
# または個別に起動
make backend    # バックエンドのみ
make mobile     # モバイルのみ
make web        # Web のみ
```

---

## 主なコマンド

| コマンド          | 説明                         |
| ----------------- | ---------------------------- |
| `make install`    | 依存インストール + Git hooks |
| `make dev`        | DB + backend + mobile 起動   |
| `make backend`    | バックエンドのみ             |
| `make mobile`     | モバイルのみ                 |
| `make web`        | Web のみ                     |
| `make db-start`   | DB 起動                      |
| `make db-stop`    | DB 停止                      |
| `make db-migrate` | マイグレーション実行         |
| `make db-reset`   | DB リセット                  |
| `make db-destroy` | DB 完全削除                  |
| `make test`       | テスト実行                   |
| `make lint`       | Lint 実行                    |

エイリアス: `make m` (mobile), `make w` (web), `make b` (backend)

全コマンド一覧: `make help`

---

## ディレクトリ構成

| パス           | 説明                             |
| -------------- | -------------------------------- |
| `apps/mobile`  | Expo + React Native クライアント |
| `apps/web`     | Next.js Web アプリ               |
| `apps/backend` | Go 製 API サーバ                 |
| `packages/`    | 共有パッケージ群                 |
| `docs/`        | ドキュメント                     |

---

## ドキュメント

| ドキュメント                                     | 内容                        |
| ------------------------------------------------ | --------------------------- |
| [docs/development.md](docs/development.md)       | 開発ガイド・CI/CD・環境変数 |
| [docs/windows-setup.md](docs/windows-setup.md)   | Windows 環境のセットアップ  |
| [apps/backend/README.md](apps/backend/README.md) | バックエンド詳細            |
| [apps/mobile/README.md](apps/mobile/README.md)   | モバイルアプリ詳細          |
| [apps/web/README.md](apps/web/README.md)         | Web アプリ詳細              |
