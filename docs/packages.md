# 共有パッケージガイド

## 概要

`packages/` 配下の共有パッケージは `@team/*` というスコープで提供される。

## パッケージ一覧

### 基盤

| パッケージ        | 説明                     |
| ----------------- | ------------------------ |
| `@team/types`     | 共通型定義               |
| `@team/constants` | 定数（カテゴリ、タグ等） |
| `@team/theme`     | テーマ・カラー定義       |

### ユーティリティ

| パッケージ             | 説明                       |
| ---------------------- | -------------------------- |
| `@team/core-utils`     | 汎用ユーティリティ関数     |
| `@team/location-utils` | 位置情報関連ユーティリティ |
| `@team/crypto-utils`   | 暗号化関連ユーティリティ   |
| `@team/validators`     | バリデーション関数         |

### ドメイン

| パッケージ        | 説明                 |
| ----------------- | -------------------- |
| `@team/shop-core` | 店舗データ・ロジック |
| `@team/api`       | API クライアント     |

### UI / フロントエンド

| パッケージ        | 説明                          |
| ----------------- | ----------------------------- |
| `@team/hooks`     | 共通 React Hooks              |
| `@team/mobile-ui` | React Native UIコンポーネント |

### 開発

| パッケージ         | 説明                 |
| ------------------ | -------------------- |
| `@team/test-utils` | テストユーティリティ |

---

## 使い方

### インポート

```typescript
// 型
import type { Shop, Menu } from '@team/types';

// 定数
import { CATEGORIES, TAGS } from '@team/constants';

// ユーティリティ
import { formatPrice } from '@team/core-utils';

// Hooks
import { useReviewsState } from '@team/hooks';

// バリデーション
import { validateShopRegistration } from '@team/validators/shop-registration';
```

### 依存関係の追加

```json
// package.json
{
  "dependencies": {
    "@team/core-utils": "workspace:*"
  }
}
```

追加後、ルートで `pnpm install` を実行。

---

## 新規パッケージ作成

```bash
pnpm create-package <name>
```

これにより `packages/<name>/` に以下の構造が作成される:

```
packages/<name>/
├── package.json
├── tsconfig.json
└── src/
    └── index.ts
```

---

## 依存関係のルール

1. **循環依存禁止**: パッケージ間の循環参照は避ける
2. **基盤パッケージ**: `types`, `constants` は他のパッケージに依存しない
3. **上位レイヤー**: `hooks`, `api` は下位の `types`, `core-utils` に依存可

依存関係の確認:

```bash
pnpm why @team/core-utils
```

---

## パッケージ構造

各パッケージの推奨構造:

```
packages/<name>/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts          # エクスポート
    ├── <機能>.ts         # 実装
    └── __tests__/        # テスト
        └── <機能>.test.ts
```

## テスト実行

```bash
# 特定パッケージ
pnpm --dir packages/core-utils test

# 全パッケージ
pnpm test
```

---

## パッケージ詳細

### @team/theme

テーマ・カラー・タイポグラフィの Single Source of Truth。

#### 構成

```
packages/theme/
├── src/
│   ├── index.ts        # エクスポート
│   ├── colors.ts       # カラー定義
│   └── typography.ts   # フォント・タイポグラフィ定義
└── scripts/
    └── generate-css-vars.ts  # Web用CSS変数生成スクリプト
```

#### エクスポート

```typescript
// カラー
export { colors, textOn, semanticColors, withAlpha } from './colors';

// タイポグラフィ
export { fontFamilies, webFontName, typographyScale } from './typography';
```

#### Web と Mobile での使い分け

| プラットフォーム          | 使用方法                       |
| ------------------------- | ------------------------------ |
| **Mobile** (React Native) | TypeScript定義を直接インポート |
| **Web** (Next.js)         | 自動生成されたCSS変数を使用    |

**Mobile での使用例:**

```typescript
import { colors, textOn, typographyScale } from '@team/theme';

<View style={{ backgroundColor: colors.primary }}>
  <Text style={{ color: textOn.primary, fontSize: typographyScale.h1.fontSize }}>
    Hello
  </Text>
</View>
```

**Web での使用例:**

```css
/* globals.css で theme-vars.css をインポート済み */
.header {
  background-color: var(--color-primary);
  color: var(--text-on-primary);
}
```

```tsx
// Tailwind クラスも CSS変数にマッピング済み
<div className='bg-theme-primary text-on-primary'>Hello</div>
```

#### CSS変数の自動生成

Web用のCSS変数ファイルは `@team/theme` から自動生成される。

```bash
# CSS変数ファイルを再生成
pnpm --filter @team/theme generate:css
```

**出力先:** `apps/web/app/theme-vars.css`

**生成されるCSS変数:**

| 変数名                | 説明                                    |
| --------------------- | --------------------------------------- |
| `--color-primary`     | プライマリカラー                        |
| `--color-secondary`   | セカンダリカラー                        |
| `--color-accent`      | アクセントカラー                        |
| `--color-background`  | 背景色                                  |
| `--text-on-primary`   | プライマリ上のテキスト色                |
| `--text-on-secondary` | セカンダリ上のテキスト色                |
| `--color-error-*`     | エラー系カラー (light/medium/base/dark) |
| `--color-success`     | 成功カラー                              |
| `--color-warning`     | 警告カラー                              |
| `--color-primary-*`   | プライマリの透明度バリアント (10/20/75) |

#### カラー変更時のワークフロー

1. `packages/theme/src/colors.ts` を編集
2. CSS変数を再生成: `pnpm --filter @team/theme generate:css`
3. 変更をコミット (theme-vars.css も含む)
