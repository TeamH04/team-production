# クリーンアーキテクチャへの移行 - 変更サマリー

## 実施内容

バックエンドのコードをクリーンアーキテクチャの原則に従って大幅にリファクタリングしました。

## 主な変更点

### 1. 新規追加されたディレクトリとファイル

#### Repository層 (`internal/repository/`)
- **store_repository.go** - ストアのデータアクセス層
- **menu_repository.go** - メニューのデータアクセス層
- **review_repository.go** - レビューのデータアクセス層

各リポジトリはインターフェースとして定義され、実装をGORMに依存させながらも、上位層からは抽象化されています。

#### UseCase層 (`internal/usecase/`)
- **store_usecase.go** - ストアのビジネスロジック
- **menu_usecase.go** - メニューのビジネスロジック
- **review_usecase.go** - レビューのビジネスロジック
- **errors.go** - アプリケーション層のエラー定義

ビジネスロジックをハンドラーから分離し、バリデーションやドメインルールを実装しています。

#### Handler層 (`internal/handlers/`)
- **store_handler.go** - ストアのHTTPハンドラー（新規）
- **menu_handler.go** - メニューのHTTPハンドラー（新規）
- **review_handler.go** - レビューのHTTPハンドラー（新規）

構造体ベースのハンドラーに変更し、依存性注入によってUseCaseを受け取るようになりました。

### 2. 更新されたファイル

#### `cmd/server/main.go`
- 依存性注入を実装
- Repository → UseCase → Handler の順でインスタンスを生成
- 各層を疎結合に保つための初期化コードを追加
- ミドルウェアの追加（Logger, Recover, CORS）

### 3. 削除されたファイル

- **internal/handlers/store.go** - 古いストアハンドラー（新しいstore_handler.goに置き換え）

### 4. ドキュメント

#### 新規作成
- **ARCHITECTURE.md** - クリーンアーキテクチャの詳細な説明
  - アーキテクチャ概要図
  - 各層の責務と役割
  - データフローの説明
  - 依存性注入の仕組み
  - テスタビリティの説明

#### 更新
- **README.md** - アーキテクチャセクションの追加

### 5. テストコード

- **internal/usecase/store_usecase_test.go** - UseCaseのユニットテスト例
  - モックリポジトリの実装
  - テストケースの作成
  - エラーハンドリングのテスト

## アーキテクチャの特徴

### レイヤー構成

```
Presentation (handlers/)
     ↓ 依存
Application (usecase/)
     ↓ 依存
Domain (domain/) ← Infrastructure (repository/)
```

### 依存性の逆転

- UseCaseはRepositoryの**インターフェース**に依存
- 具体的な実装（GORM）には依存しない
- テスト時にモックと簡単に入れ替え可能

### 責務の分離

| 層 | 責務 |
|---|---|
| **Handler** | HTTPリクエスト/レスポンスの処理 |
| **UseCase** | ビジネスロジック、バリデーション |
| **Repository** | データベースアクセス |
| **Domain** | エンティティ定義 |

## メリット

1. **テスタビリティ向上**
   - 各層を独立してテスト可能
   - モックの作成が容易
   - ユニットテストのサンプルを提供

2. **保守性向上**
   - 各層の責務が明確
   - 変更の影響範囲が限定的
   - コードの可読性が向上

3. **拡張性向上**
   - 新機能の追加が容易
   - レイヤーごとに独立して拡張可能

4. **ビジネスロジックの独立性**
   - フレームワークから独立
   - データベースの実装から独立
   - ドメインロジックが明確

## ビルド結果

✅ ビルド成功
✅ 全てのユニットテストがパス（3つのテストケース）

```bash
go build -o bin/server ./cmd/server
# 成功

go test ./internal/usecase/... -v
# PASS: TestStoreUseCase_GetAllStores
# PASS: TestStoreUseCase_CreateStore_Success
# PASS: TestStoreUseCase_CreateStore_InvalidInput
```

## 今後の推奨事項

1. **統合テストの追加**
   - 実際のデータベースを使用したテスト
   - Handler層のE2Eテスト

2. **テストカバレッジの向上**
   - Menu、ReviewのUseCaseテストを追加
   - Repository層のテストを追加

3. **バリデーションの強化**
   - より詳細な入力検証
   - カスタムバリデーションルールの追加

4. **ロギングとモニタリング**
   - 構造化ロギングの導入
   - メトリクスの追加

5. **エラーハンドリングの改善**
   - より詳細なエラー型の定義
   - エラーコンテキストの追加
