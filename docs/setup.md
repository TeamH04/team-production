# 詳細セットアップガイド

## 前提条件

| ツール  | バージョン | 確認コマンド |
| ------- | ---------- | ------------ |
| Node.js | 24系       | `node -v`    |
| Go      | 1.25+      | `go version` |
| Docker  | 最新       | `docker -v`  |
| pnpm    | 10.28+     | `pnpm -v`    |

## セットアップ手順

### 1. リポジトリクローン

```bash
git clone <repo-url>
cd team-production
```

### 2. 依存関係インストール

```bash
make install
```

これにより以下が実行される:

- pnpm install（Node.js依存関係）
- Git hooks設定（pre-commit）

### 3. 環境変数設定

```bash
cp .env.example .env
cp apps/backend/.env.example apps/backend/.env
cp apps/mobile/.env.example apps/mobile/.env
```

各ファイルを編集して必要な値を設定。

### 4. golang-migrate インストール

マイグレーション実行に必要:

```bash
go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest
```

PATH に追加:

```bash
export PATH=$PATH:$HOME/go/bin
```

永続化する場合は `~/.bashrc` または `~/.zshrc` に追記。

### 5. DB起動 + マイグレーション

```bash
make db-migrate
```

起動するコンテナ:

| コンテナ          | 説明       | ポート |
| ----------------- | ---------- | ------ |
| tp-local-postgres | PostgreSQL | 5432   |
| tp-pgadmin        | 管理UI     | 5050   |

### 6. 開発サーバー起動

```bash
make dev
```

起動するサービス:

| サービス    | ポート |
| ----------- | ------ |
| Backend API | 8080   |
| Expo Metro  | 8081   |

### 7. 動作確認

```bash
curl http://localhost:8080/health
# → {"status":"ok"}
```

---

## 環境変数

### Backend

`apps/backend/.env`:

| 変数                       | 説明                      |
| -------------------------- | ------------------------- |
| `PORT`                     | サーバーポート            |
| `DATABASE_URL`             | DB接続文字列              |
| `SUPABASE_URL`             | Supabase URL              |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase 公開キー         |
| `SUPABASE_SECRET_KEY`      | Supabase シークレットキー |

### Mobile

`apps/mobile/.env`:

| 変数                                   | 説明              |
| -------------------------------------- | ----------------- |
| `EXPO_PUBLIC_API_BASE_URL`             | APIベースURL      |
| `EXPO_PUBLIC_SUPABASE_URL`             | Supabase URL      |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase 公開キー |

---

## トラブルシューティング

### ポート競合

```bash
make db-stop
# または
docker ps  # 確認
docker stop <container-id>
```

### マイグレーションエラー

```bash
# migrate コマンドが見つからない
export PATH=$PATH:$HOME/go/bin

# DBがまだ起動していない
make db-start
sleep 3
make db-migrate
```

### API が 500 エラーを返す

- DBが起動しているか確認: `docker ps`
- マイグレーションが実行されているか確認

### Expo が起動しない

```bash
pnpm --dir apps/mobile clean
pnpm dev
```

---

## Windows ユーザー

**WSL2 の使用を強く推奨**

詳細: [windows-setup.md](windows-setup.md)
