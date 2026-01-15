# API

## 1. ドキュメント情報

- **作成者:** [佐野優斗](mailto:kd1390153@st.kobedenshi.ac.jp)
- **編集者:**
- **ステータス:** 進行中
- **最終更新日:** 2025年10月13日
- **メモ:** 間違いがあれば、適宜指摘してほしいです

---

## 2. 必要なAPI

### 認証関連（Supabase Auth連携）

| Method | Endpoint           | 概要                                                 | 作成 |
| :----- | :----------------- | :--------------------------------------------------- | :--- |
| `POST` | `/api/auth/signup` | Supabase Auth経由でユーザー登録（OAuth）             | 完了 |
| `POST` | `/api/auth/login`  | Supabase Auth経由でログイン（JWT取得）               | 完了 |
| `GET`  | `/api/auth/me`     | 現在ログイン中のユーザー情報を返す（JWT検証）        | 完了 |
| `PUT`  | `/api/auth/role`   | ログイン済みユーザーのロールを変更（例：user→owner） | 完了 |

---

### ユーザー関連

| Method   | Endpoint                            | 概要                                 | 作成   |
| :------- | :---------------------------------- | :----------------------------------- | :----- |
| `GET`    | `/api/users/:id`                    | 特定ユーザーのプロフィールを取得     | 進行中 |
| `PUT`    | `/api/users/:id`                    | プロフィール更新（ユーザー本人のみ） | 進行中 |
| `GET`    | `/api/users/me`                     | ログインユーザー自身の情報を返す     | 進行中 |
| `GET`    | `/api/users/me/favorites`           | お気に入り店舗一覧を取得             | 進行中 |
| `POST`   | `/api/users/me/favorites`           | 店舗をお気に入り登録                 | 進行中 |
| `DELETE` | `/api/users/me/favorites/:store_id` | お気に入り解除                       | 進行中 |
| `GET`    | `/api/users/:id/reviews`            | ユーザーのレビュー一覧を取得         | 完了   |

---

### 店舗関連

| Method   | Endpoint                  | 概要                                     | 作成 |
| :------- | :------------------------ | :--------------------------------------- | :--- |
| `GET`    | `/api/stores`             | 店舗一覧を取得（クエリで検索・絞り込み） | 完了 |
| `POST`   | `/api/stores`             | 新規店舗登録（オーナー）                 | 完了 |
| `GET`    | `/api/stores/:id`         | 店舗詳細取得（メニュー・レビュー含む）   | 完了 |
| `PUT`    | `/api/stores/:id`         | 店舗情報更新（オーナーまたは管理者）     | 完了 |
| `DELETE` | `/api/stores/:id`         | 店舗削除（管理者のみ）                   | 完了 |
| `GET`    | `/api/stores/:id/menus`   | 店舗のメニュー一覧取得                   | 完了 |
| `POST`   | `/api/stores/:id/menus`   | メニュー登録（オーナー用）               | 完了 |
| `GET`    | `/api/stores/:id/reviews` | 店舗のレビュー一覧取得                   | 完了 |
| `POST`   | `/api/stores/:id/reviews` | レビュー投稿（ユーザー）                 | 完了 |
| `POST`   | `/api/reviews/:id/likes`  | レビューへのいいね                       | 完了 |
| `DELETE` | `/api/reviews/:id/likes`  | レビューのいいね解除                     | 完了 |

---

### 管理者用エンドポイント（Admin）

| Method | Endpoint                        | 概要                           | 作成   |
| :----- | :------------------------------ | :----------------------------- | :----- |
| `GET`  | `/api/admin/stores/pending`     | 承認待ち店舗一覧取得           | 完了   |
| `POST` | `/api/admin/stores/:id/approve` | 店舗を承認（公開）             | 完了   |
| `POST` | `/api/admin/stores/:id/reject`  | 店舗を差し戻し（非公開）       | 完了   |
| `GET`  | `/api/admin/reports`            | 通報一覧取得                   | 未作成 |
| `POST` | `/api/admin/reports/:id/action` | 通報への対応（削除・警告など） | 未作成 |

---

### 通報関連

| Method | Endpoint       | 概要                         | 作成   |
| :----- | :------------- | :--------------------------- | :----- |
| `POST` | `/api/reports` | ユーザーがレビューなどを通報 | 未作成 |

---

### メディア関連（Supabase Storage）

| Method | Endpoint            | 概要                                                             | 作成   |
| :----- | :------------------ | :--------------------------------------------------------------- | :----- |
| `POST` | `/api/media/upload` | 署名付きURLを発行して、クライアントから直接Storageにアップロード | 完了   |
| `GET`  | `/api/media/:id`    | メディア情報（URL, metadata等）を取得                            | 未作成 |

---

## レスポンスフォーマット例

### 成功時

```json
{
  "status": "success",
  "data": { ... },
  "message": "optional info",
  "error": null
}
```

### エラー時

```json
{
  "status": "error",
  "message": "invalid id",
  "code": 400
}
```

---

## 認可ポリシー（RBAC）

| ロール    | 権限概要                                         |
| :-------- | :----------------------------------------------- |
| **user**  | 店舗閲覧、レビュー投稿、お気に入り登録、通報     |
| **owner** | 自店舗の登録・編集、メニュー登録                 |
| **admin** | 店舗承認・差し戻し、通報対応、全データ閲覧・削除 |

---

## 補足: バックエンド構成案（Go実装用）

| パッケージ    | 役割                                           |
| :------------ | :--------------------------------------------- |
| `/handlers`   | 各APIエンドポイントの処理（Echo）              |
| `/models`     | GORMモデル定義                                 |
| `/routes`     | ルーティング設定                               |
| `/middleware` | JWT認証・ロールチェック                        |
| `/services`   | ビジネスロジック（レビュー投稿、店舗承認など） |
| `/config`     | DB接続・環境変数読み込み                       |

---

**これで「ユーザー」「店舗」「レビュー」「お気に入り」「管理者」「メディア」「通報」のすべての機能がカバーされています。**

**MVP段階では、以下を優先的に実装すればOKです：**

✅ `/api/media/upload`（Storage署名URL）

---

## 認証関連

### ユーザー関連

#### GET `/api/users/:id`

**何をしているAPIか？**  
特定のユーザー情報（プロフィール）を取得するAPIです。

**処理の流れ**

1. URLパラメータからユーザーIDを取得  
   例：`/api/users/c7e4fabc-1234-4e8a-98e3-abcdef123456`
2. データベース（usersテーブル）から該当ユーザーを検索
3. ユーザーが存在すればJSONで返す

**エラー処理**

- 指定IDが存在しない → `404 Not Found`
- DBエラー → `500 Internal Server Error`

---

#### PUT `/api/users/:id`

**何をしているAPIか？**  
ユーザー本人がプロフィールを更新するAPI。

**処理の流れ**

1. URLパラメータからユーザーID取得
2. JSON本文から更新内容（`name`, `gender`, `birthday`, `icon_url`, `icon_file_id`など）を受け取る
3. 認証情報を確認（本人チェック）
4. DBで情報更新
5. 更新結果をJSONで返す

**エラー処理**

- ユーザーなし → `404`
- 他人の変更 → `403`
- DB失敗 → `500`

---

#### GET `/api/users/me`

**何をしているAPIか？**  
ログインユーザー自身のプロフィールを取得するAPI。

**処理の流れ**

1. クエリパラメータ `user_id` 取得
2. 未指定なら `400 Bad Request`
3. usersテーブルで検索
4. 見つかれば返却、なければ `404`

---

## 店舗関連

#### GET `/api/stores`

**何をしているAPIか？**  
店舗一覧を取得するAPI。

**処理の流れ**

1. DBから全店舗を取得（新しい順）
2. 成功時 → `200 OK` + JSON
3. 失敗時 → `500 Internal Server Error`

---

#### POST `/api/stores`

**何をしているAPIか？**  
新規店舗登録を行うAPI。

**処理の流れ**

1. JSON本文を受け取る
2. 必須項目チェック（name, address, place_id, thumbnail_file_id）
3. DBへ保存
4. 保存結果を返す

---

#### GET `/api/stores/:id`

**何をしているAPIか？**  
店舗詳細情報を取得するAPI。

**処理の流れ**

1. URLのIDを取得
2. 該当店舗をDBから検索（メニュー・レビュー含む）
3. 成功時 → JSON返却
4. エラー処理 → `400` / `404` / `500`

---

#### GET `/api/stores/:id/menus`

**何をしているAPIか？**  
店舗のメニュー一覧を取得。

**処理の流れ**

1. 店舗ID取得
2. IDチェック
3. DBから該当店舗のメニュー取得
4. JSON返却

---

#### POST `/api/stores/:id/menus`

**何をしているAPIか？**  
店舗のメニュー登録を行うAPI。

**処理の流れ**

1. 店舗ID取得
2. JSON本文をGo構造体に変換
3. 必須チェック（`name`, `price`）
4. DB保存
5. 保存結果を返却

---

#### GET `/api/stores/:id/reviews`

**何をしているAPIか？**  
店舗レビュー一覧を取得。

**処理の流れ**

1. 店舗ID取得
2. IDチェック
3. `sort` クエリで並び順を決定（`new` / `liked`）
4. レビュー取得
5. JSON返却

---

#### POST `/api/stores/:id/reviews`

**何をしているAPIか？**  
店舗にレビューを投稿するAPI。

**処理の流れ**

1. 店舗ID取得
2. JSON本文受け取り（`rating`, `content`, `file_ids`）
3. DB保存
4. 保存結果を返却

---

#### POST `/api/reviews/:id/likes`

**何をしているAPIか？**  
レビューにいいねを付けるAPI。

**処理の流れ**

1. レビューID取得
2. 認証情報からユーザーID取得
3. 既存のいいねがなければ作成
4. `204 No Content` を返却

---

#### DELETE `/api/reviews/:id/likes`

**何をしているAPIか？**  
レビューのいいねを解除するAPI。

**処理の流れ**

1. レビューID取得
2. 認証情報からユーザーID取得
3. いいねを削除
4. `204 No Content` を返却

---

#### POST `/api/media/upload`

**何をしているAPIか？**  
レビュー画像のアップロード用に署名付きURLを発行するAPI。

**処理の流れ**

1. JSON本文で `store_id` と `files` を受け取る
2. 署名付きURLを生成
3. `files` 配列に `file_id` と `upload_url` を返却

---

## お気に入り関連

（今後追記）

## 管理者用エンドポイント（Admin）

（今後追記）

## 通報関連

（今後追記）

## メディア関連

（今後追記）
