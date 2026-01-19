# Mobile (Expo + React Native)

Expo Router を採用した店舗探索アプリ。

## クイックスタート

```bash
# リポジトリルートから
make mobile    # モバイル起動
make dev       # DB + backend + mobile 同時起動
```

## コマンド

### リポジトリルートから

| コマンド           | 説明         |
| ------------------ | ------------ |
| `make mobile`      | モバイル起動 |
| `make dev`         | 全部起動     |
| `make test-mobile` | テスト実行   |

### 直接実行

| コマンド          | 説明           |
| ----------------- | -------------- |
| `pnpm android`    | Android で起動 |
| `pnpm ios`        | iOS で起動     |
| `pnpm dev:tunnel` | トンネルモード |

## 環境変数

`apps/mobile/.env`:

| 変数                                   | 説明              |
| -------------------------------------- | ----------------- |
| `EXPO_PUBLIC_API_BASE_URL`             | APIベースURL      |
| `EXPO_PUBLIC_SUPABASE_URL`             | Supabase URL      |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase 公開キー |

## 画面構成

- **ホーム**: 人気/近い/新着ソート
- **検索**: キーワード/カテゴリ/タグ絞り込み
- **お気に入り**: ローカル管理
- **マイページ**: プロフィール編集
- **店舗詳細**: 画像スライダー、メニュー、地図

## 認証

- Supabase OAuth（Google / Apple）
- オーナー用：メール + パスワード
