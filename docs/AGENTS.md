# Agent Notes

## Lintルール

- ESLint の `react-native/no-inline-styles`・`react-native/no-color-literals`・`react-native/sort-styles` を必ず守ること。
- レイアウトや色の指定は `StyleSheet.create` で定義したスタイル定数を経由し、インラインオブジェクトを避ける。
- 色はパレットなどの定数を経由して参照し、ハードコードしたカラーリテラルを禁止する。
- 各スタイルオブジェクトのプロパティキーはアルファベット順（A→Z）に整列させる。
- React Hooks を使用する場合は `react-hooks/exhaustive-deps` の指摘に従い、依存配列を必ず更新する。
- 未使用のスタイル定義は削除し、`react-native/no-unused-styles` に違反しないようにする。

## ワークフロー

- ナビゲーションやスタイリングの規約を変更した際は関連ドキュメントを更新する。
- 変更後は `pnpm --dir apps/mobile lint` を実行し、ルール違反が無いことを確認する。
- 「エラー修正」とだけ指示された場合は `docs/ESLint_Report.md` を開いて対象箇所を確認する。
