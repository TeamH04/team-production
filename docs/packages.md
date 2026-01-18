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
