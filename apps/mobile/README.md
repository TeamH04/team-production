# モバイルアプリ（Expo + React Native）

## 概要

- Expo Router を採用した店舗探索アプリ（プロトタイプ）
- 店舗データは共有パッケージ `@team/shop-core` から取得
- ローカル状態で以下を管理
  - 検索 / 絞り込み
  - お気に入り
  - 訪問済み
  - レビュー履歴（ダミー）
- 認証
  - Supabase OAuth（Google / Apple）
  - オーナー用：メール + パスワードログイン

---

## 前提条件

- Node.js **24 以上**
- pnpm **10 以上**（`corepack enable pnpm` 推奨）
- iOS / Android エミュレータ または 物理端末 + Expo Go

---

## セットアップ手順

1. 依存関係のインストール

   ```bash
   pnpm install
   ```

2. 環境変数の設定

   ```bash
   cp apps/mobile/.env.example apps/mobile/.env
   ```

   最低限設定する項目：
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - `EXPO_PUBLIC_WEB_BASE_URL`

3. アプリ起動

   ```bash
   pnpm --dir apps/mobile android
   pnpm --dir apps/mobile ios
   pnpm --dir apps/mobile web
   ```

   または Expo Go で QR を読み取る

---

## 主なコマンド

| コマンド                         | 説明                                                   |
| -------------------------------- | ------------------------------------------------------ |
| `pnpm dev`                       | ルートから Expo をトンネル付き起動（キャッシュクリア） |
| `pnpm --dir apps/mobile start`   | Metro Bundler を通常起動                               |
| `pnpm --dir apps/mobile android` | Android エミュレータで起動                             |
| `pnpm --dir apps/mobile ios`     | iOS エミュレータで起動                                 |
| `pnpm --dir apps/mobile web`     | Web で起動                                             |
| `pnpm --dir apps/mobile lint`    | ESLint 実行                                            |

---

## 画面と機能

### ホーム

- 人気 / 近い / 新着 ソート
- おすすめフィルタ付きカード一覧

### 検索

- キーワード / カテゴリ / タグ / 訪問済みで絞り込み
- ソート変更
- 検索履歴保存

### お気に入り

- ローカルの `Set` で管理
- 店舗詳細からトグル可能

### マイページ

- プロフィール編集
- ゲスト状態確認
- サインアウト

### 店舗詳細

- 画像スライダー
- メニュータブ
- 地図リンク（Google Maps place ID）
- お気に入り / 共有ボタン

### オーナー

- メール + パスワードログイン
- 店舗登録フォーム（UI のみ）

### 認証

- Supabase OAuth 認証後に `/(tabs)` または `/owner` に遷移
- 開発用ゲストモード：

  ```env
  EXPO_PUBLIC_ENABLE_DEV_MODE=true
  ```

---

## 開発時の補足

- `make dev` で以下を同時起動可能
  - Postgres + Go API（Docker Compose）
  - Expo アプリ

- `scripts/start-dev.js` 経由で起動し、以下を自動設定
  - `EXPO_DEV_SERVER_PORT`
  - `EXPO_METRO_LISTEN_PORT`

- 画像はすべてリモート URL
  - ローカル差し替えは `assets/` に配置

- スタイリング
  - 基本：`StyleSheet.create`
  - 一部：NativeWind 併用

---

## 環境変数の注意点

- `.env` の `EXPO_PUBLIC_*` はクライアントから直接参照される

- Supabase 設定が必要な項目
  - Authentication > URL Configuration に Expo のリダイレクト URL を登録
    - 例：`https://auth.expo.dev/...`
  - Google / Apple プロバイダーのクライアント情報登録必須
