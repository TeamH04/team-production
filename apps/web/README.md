# Web (Next.js)

Next.js 15 (App Router) の店舗探索アプリ。

## クイックスタート

```bash
# リポジトリルートから
make web    # Web 起動
```

## コマンド

| コマンド                    | 説明             |
| --------------------------- | ---------------- |
| `make web`                  | 開発サーバー起動 |
| `make test-web`             | テスト実行       |
| `pnpm --dir apps/web build` | ビルド           |

## 画面構成

### トップページ `/`

- 検索ボックスとカテゴリチップで絞り込み
- 「さらに読み込む」で 9 件ずつ追加表示

### 店舗詳細 `/shop/[id]`

- 画像スライダー、タグ、メニュー、地図リンク
- 共有/お気に入りボタン

## ポート

http://localhost:3000

---

## テーマ・スタイル

### CSS変数

Web では `@team/theme` から自動生成された CSS変数を使用する。

```
app/
├── globals.css       # Tailwind + テーマ変数インポート
└── theme-vars.css    # 自動生成（編集禁止）
```

### カラーの使用

```tsx
// カスタムテーマクラス（推奨）
<div className="bg-theme-primary text-on-primary">...</div>

// CSS変数を直接使用
<div style={{ backgroundColor: 'var(--color-primary)' }}>...</div>
```

### カラー変更時

1. `packages/theme/src/colors.ts` を編集
2. CSS変数を再生成:
   ```bash
   pnpm --filter @team/theme generate:css
   ```
3. 変更をコミット

> **Note:** `theme-vars.css` は自動生成ファイルのため、直接編集しないこと。
