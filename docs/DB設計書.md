# DBとE-R図

---

## 1. ドキュメント情報

- **作成者:** 佐野
- **編集者:**
- **ステータス:** draft
- **最終更新日:** 2026/01/02
- **メモ:** DB設計を変更した場合、SQLも変更すること。中間テーブル（review_menus / review_files / store_files / review_likes）はORMモデルにも含める。

---

## 2. DB設計

### users（ユーザー情報）

| カラム名     | 型             | 説明                       |
| :----------- | :------------- | :------------------------- |
| user_id      | UUID（主キー） | Supabase Auth と連携       |
| name         | string         | ユーザー名                 |
| gender       | string         | 性別                       |
| birthday     | date           | 生年月日                   |
| email        | string         | メールアドレス（unique）   |
| icon_url     | string         | 外部プロフィール画像URL    |
| icon_file_id | uuid           | アプリ内アップロード画像ID |
| provider     | string         | 認証プロバイダ             |
| role         | string         | 権限（user/owner/admin）   |
| created_at   | time.Time      | 作成日時                   |
| updated_at   | time.Time      | 更新日時                   |

---

### stores（店舗情報）

| カラム名          | 型               | 説明                        |
| :---------------- | :--------------- | :-------------------------- |
| store_id          | uuid（主キー）   | 店舗ID                      |
| thumbnail_file_id | uuid             | サムネイル画像（files参照） |
| name              | string           | 店舗名                      |
| opened_at         | date             | オープン日                  |
| description       | string           | 店舗の説明文                |
| address           | string           | 住所                        |
| opening_hours     | string           | 営業時間（JSON形式も可）    |
| latitude          | double precision | 緯度                        |
| longitude         | double precision | 経度                        |
| google_map_url    | string           | Google Maps URL             |
| is_approved       | boolean          | 承認済みかどうか            |
| created_at        | timestamp        | 作成日時                    |
| updated_at        | time.Time        | 更新日時                    |

---

### favorites（お気に入り）

| カラム名                        | 型                                 | 説明           |
| :------------------------------ | :--------------------------------- | :------------- |
| user_id                         | uuid（外部キー → users.user_id）   | ユーザーID     |
| store_id                        | uuid（外部キー → stores.store_id） | 店舗ID         |
| created_at                      | timestamp                          | 登録日時       |
| PRIMARY KEY (user_id, store_id) | 制約                               | 重複登録を防ぐ |

---

### menus（メニュー）

| カラム名    | 型                                 | 説明       |
| :---------- | :--------------------------------- | :--------- |
| menu_id     | uuid（主キー）                     | メニューID |
| store_id    | uuid（外部キー → stores.store_id） | 店舗ID     |
| name        | string                             | メニュー名 |
| price       | integer                            | 価格       |
| description | string                             | 説明文     |
| created_at  | timestamp                          | 作成日時   |

---

### reviews（レビュー）

| カラム名   | 型                                 | 説明         |
| :--------- | :--------------------------------- | :----------- |
| review_id  | uuid（主キー）                     | レビューID   |
| store_id   | uuid（外部キー → stores.store_id） | 店舗ID       |
| user_id    | uuid（外部キー → users.user_id）   | ユーザーID   |
| rating     | integer（1?5）                     | 評価         |
| content    | string                             | レビュー内容 |
| created_at | timestamp                          | 作成日時     |

---

### review_menus（レビューとメニューの中間）

| カラム名    | 型                                   | 説明                           |
| :---------- | :----------------------------------- | :----------------------------- |
| review_id   | uuid（外部キー → reviews.review_id） | レビューID                     |
| menu_id     | uuid（外部キー → menus.menu_id）     | 紐づくメニューID               |
| PRIMARY KEY | (review_id, menu_id)                 | 同一メニューの重複紐付けを防ぐ |

---

### review_files（レビューとファイルの中間）

| カラム名    | 型                                   | 説明                           |
| :---------- | :----------------------------------- | :----------------------------- |
| review_id   | uuid（外部キー → reviews.review_id） | レビューID                     |
| file_id     | uuid（外部キー → files.file_id）     | 添付ファイルID                 |
| PRIMARY KEY | (review_id, file_id)                 | 同一ファイルの重複紐付けを防ぐ |

---

### review_likes（レビューいいね）

| カラム名    | 型                                   | 説明             |
| :---------- | :----------------------------------- | :--------------- |
| review_id   | uuid（外部キー → reviews.review_id） | レビューID       |
| user_id     | uuid（外部キー → users.user_id）     | ユーザーID       |
| created_at  | timestamp                            | いいね日時       |
| PRIMARY KEY | (review_id, user_id)                 | 重複いいねを防ぐ |

---

### store_files（店舗とファイルの中間）

| カラム名    | 型                                 | 説明                           |
| :---------- | :--------------------------------- | :----------------------------- |
| store_id    | uuid（外部キー → stores.store_id） | 店舗ID                         |
| file_id     | uuid（外部キー → files.file_id）   | 店舗に紐づくファイルID         |
| created_at  | timestamp                          | 紐付け日時                     |
| PRIMARY KEY | (store_id, file_id)                | 同一ファイルの重複紐付けを防ぐ |

---

### files（ファイル）

| カラム名     | 型                               | 説明                              |
| :----------- | :------------------------------- | :-------------------------------- |
| file_id      | uuid（主キー）                   | ファイルID                        |
| file_kind    | string                           | 種別（例：thumbnail, reviewなど） |
| file_name    | string                           | 元ファイル名                      |
| file_size    | bigint                           | ファイルサイズ                    |
| object_key   | string                           | Storage上のオブジェクトキー       |
| content_type | string                           | MIMEタイプ                        |
| is_deleted   | boolean                          | 論理削除フラグ                    |
| created_at   | timestamp                        | 作成日時                          |
| created_by   | uuid（外部キー → users.user_id） | 作成ユーザーID                    |

---

## 4. E-R図

```mermaid
erDiagram
    users ||--o{ reviews : "投稿する"
    users ||--o{ favorites : "登録する"
    users ||--o{ files : "アップロード"
    users ||--o{ review_likes : "いいねする"
    stores ||--o{ reviews : "受ける"
    stores ||--o{ favorites : "登録される"
    stores ||--o{ menus : "持つ"
    stores ||--o{ store_files : "ファイルを持つ"
    reviews ||--o{ review_menus : "対象メニュー"
    menus ||--o{ review_menus : "紐づく"
    reviews ||--o{ review_files : "添付する"
    files ||--o{ review_files : "添付される"
    reviews ||--o{ review_likes : "いいねされる"
    files ||--o{ store_files : "管理される"

    users {
        uuid user_id PK
        string name
        string email
        string icon_url
        uuid icon_file_id
        string gender
        date birthday
        string provider
        string role
        timestamp created_at
        timestamp updated_at
    }

    files {
        uuid file_id PK
        string file_kind
        string file_name
        bigint file_size
        string object_key
        string content_type
        boolean is_deleted
        timestamp created_at
        uuid created_by FK
    }

    stores {
        uuid store_id PK
        uuid thumbnail_file_id FK
        string name
        date opened_at
        string description
        string address
        string opening_hours
        double_precision latitude
        double_precision longitude
        string google_map_url
        boolean is_approved
        timestamp created_at
        timestamp updated_at
    }

    favorites {
        uuid user_id FK
        uuid store_id FK
        timestamp created_at
    }

    menus {
        uuid menu_id PK
        uuid store_id FK
        string name
        integer price
        string description
        timestamp created_at
    }

    reviews {
        uuid review_id PK
        uuid store_id FK
        uuid user_id FK
        integer rating
        string content
        timestamp created_at
    }

    review_menus {
        uuid review_id FK
        uuid menu_id FK
    }

    review_files {
        uuid review_id FK
        uuid file_id FK
    }

    review_likes {
        uuid review_id FK
        uuid user_id FK
        timestamp created_at
    }

    store_files {
        uuid store_id FK
        uuid file_id FK
        timestamp created_at
    }
```

---

## 5. ミーティング後の追加

### 店舗タブ切り替え用のDB設計

#### 要件

- アプリの店舗一覧を既存の `opened_at` で切り替えできるようにする。
- 現在の日付から `opened_at` を引いた値を `new_stores` に代入。
- 判定基準となる期間（日数）は **環境変数または設定テーブルで管理** し、将来的に変更可能とする。

---

#### 実装方針

- `new_stores` を利用し、クエリで条件抽出を行う。
- 判定期間（日数）はパラメータで設定する。
  - 例：`new_stores = 30`（環境変数または「新規店舗を1か月」とする場合）
  - または `configurations` テーブルに管理キーとして保存する。

---

#### サンプルクエリ（環境変数を利用する場合）

```mermaid
flowchart LR
    A[アプリ起動] --> B{環境変数<br/>new_stores取得}
    B --> C[new_stores = 30日]
    C --> D[SQLクエリ実行]
    D --> E[opened_at >= NOW<br/>- 30日]
    E --> F[新規店舗リスト取得]
    F --> G[opened_atで降順ソート]
    G --> H[店舗一覧表示]
```

```sql
-- new_stores = 30 の場合
SELECT * FROM stores
WHERE opened_at >= NOW() - (INTERVAL '1 day' * 30)
ORDER BY opened_at DESC;
```
