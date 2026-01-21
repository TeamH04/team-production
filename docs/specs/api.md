# API 設計書

## ドキュメント情報

- オーナー: Team Production
- ステータス: 更新中（最終更新: 2025-02-17）
- 対象: `apps/backend`（Go / Echo / GORM）

## ベース情報

- Base URL: `http://localhost:8080/api`
- 認証: `Authorization: Bearer <JWT>`（Supabase で発行）。ロールは `user` / `owner` / `admin`。
- 共通レスポンス: JSON。成功時は各リソースの JSON、エラー時は `{"message": "..."}` を返却（Echo 標準のステータスコード）。

## エンドポイント一覧

| Method | Path                             | 認証        | 備考                                            |
| ------ | -------------------------------- | ----------- | ----------------------------------------------- |
| POST   | `/auth/signup`                   | なし        | Supabase Admin API 経由でユーザー作成 + DB 登録 |
| POST   | `/auth/login`                    | なし        | パスワードログイン（アクセストークン返却）      |
| GET    | `/auth/me`                       | user        | トークンのユーザー情報を取得                    |
| PUT    | `/auth/role`                     | user        | ロール変更（例: user→owner）                    |
| POST   | `/auth/owner/signup/complete`    | user        | Supabase OTP完了後のオーナー登録確定            |
| GET    | `/stores`                        | なし        | 店舗一覧（メニュー/レビュー付き）               |
| GET    | `/stores/:id`                    | なし        | 店舗詳細取得                                    |
| POST   | `/stores`                        | owner/admin | 店舗作成（承認フラグ `is_approved` 含む）       |
| PUT    | `/stores/:id`                    | owner/admin | 店舗更新                                        |
| DELETE | `/stores/:id`                    | admin       | 店舗削除                                        |
| GET    | `/stores/:id/menus`              | なし        | 店舗のメニュー一覧                              |
| POST   | `/stores/:id/menus`              | owner/admin | メニュー登録                                    |
| GET    | `/stores/:id/reviews`            | なし        | 店舗レビュー一覧                                |
| POST   | `/stores/:id/reviews`            | user        | レビュー投稿                                    |
| GET    | `/users/me`                      | user        | 自分のプロフィール取得                          |
| PUT    | `/users/:id`                     | user        | プロフィール更新（本人のみ想定）                |
| GET    | `/users/:id/reviews`             | なし        | ユーザーのレビュー一覧                          |
| GET    | `/users/:id/favorites`           | なし        | お気に入り一覧（店舗をネストして返却）          |
| POST   | `/users/:id/favorites`           | user        | お気に入り登録                                  |
| DELETE | `/users/:id/favorites/:store_id` | user        | お気に入り解除                                  |
| POST   | `/reports`                       | user        | 通報登録                                        |
| GET    | `/admin/stores/pending`          | admin       | 承認待ち店舗一覧                                |
| POST   | `/admin/stores/:id/approve`      | admin       | 店舗承認（公開）                                |
| POST   | `/admin/stores/:id/reject`       | admin       | 店舗差し戻し                                    |
| GET    | `/admin/reports`                 | admin       | 通報一覧                                        |
| POST   | `/admin/reports/:id/action`      | admin       | 通報対応（ステータス更新）                      |
| GET    | `/admin/users/:id`               | admin       | ユーザー詳細取得                                |
| POST   | `/media/upload`                  | user        | Storage へのアップロード用署名付き URL を発行   |
| GET    | `/media/:id`                     | なし        | メディア情報取得                                |

## リクエスト/レスポンス概要

### 認証

- `POST /auth/signup`
  - Req: `{ "email", "password", "name" }`
  - Res: ユーザー JSON（`user_id`, `email`, `role`, `created_at` など）
- `POST /auth/owner/signup/complete`
  - Req: `{ "contact_name", "store_name", "opening_date", "phone?" }`
  - Res: ユーザー JSON（`user_id`, `email`, `role`, `created_at` など）
- `POST /auth/login`
  - Req: `{ "email", "password" }`
  - Res: `{ access_token, refresh_token, token_type, expires_in, user: { id, email, role } }`
- `GET /auth/me` / `PUT /auth/role`
  - Res: User JSON（`user_id`, `name`, `email`, `role`, `created_at`, `updated_at`）

### 店舗 / メニュー / レビュー

- `Store` フィールド: `store_id`, `name`, `thumbnail_url`, `description`, `address`, `place_id`, `opened_at`, `opening_hours`, `landscape_photos[]`, `latitude`, `longitude`, `is_approved`, `created_at`, `updated_at`, `menus[]`, `reviews[]`。
- `POST /stores`
  - Req: `{ name, address, thumbnail_url, place_id, latitude, longitude, opened_at?, description?, opening_hours?, landscape_photos?[] }`
  - Res: Store JSON
- `POST /stores/:id/menus`
  - Req: `{ name, price?, image_url?, description? }`
  - Res: Menu JSON（`menu_id`, `store_id`, `created_at` など）
- `POST /stores/:id/reviews`
  - Req: `{ user_id, menu_id, rating(1-5), content?, image_urls?[] }`
  - Res: Review JSON（`review_id`, `posted_at`, `created_at` など）

### ユーザー / お気に入り

- `User` フィールド: `user_id`, `name`, `email`, `phone?`, `icon_url?`, `gender?`, `birthday?`, `role`, `created_at`, `updated_at`。
- `Favorite` フィールド: `favorite_id`, `user_id`, `store_id`, `created_at`, `store?`（Store をネスト）。

### 通報 / 管理

- `Report` フィールド: `report_id`, `user_id`, `target_type`, `target_id`, `reason`, `status(pending/resolved/rejected)`, `created_at`, `updated_at`。
- 管理系エンドポイントは `JWTAuth + RequireRole('admin')` ミドルウェアで保護。

### メディア

- `POST /media/upload`: ファイルメタデータを受け取り、Storage への署名付き URL を返却。
- `GET /media/:id`: `media_id`, `url`, `file_type`, `file_size`, `user_id`, `created_at` を返却。

## 認可とミドルウェア

- `JWTAuth`: Supabase 署名検証を行い、`Authorization: Bearer` ヘッダーが必須。
- `RequireRole('owner'|'admin')`: 店舗作成/更新/削除や管理系に適用。

## 備考

- モデルのフィールドは `apps/backend/internal/presentation/presenter/responses.go` を参照。
- マイグレーションは `migrations/000001_init.up.sql` から開始しており、`is_approved` や `price` などの列追加は今後のマイグレーションで補完予定。
