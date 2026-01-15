# Agent Notes (Dev Instructions)

## Setup & Environment

- **Use Node.js 24.x and pnpm 10+.** (Node.js 24.x / pnpm 10 以上を使用すること)
- **Use Go 1.23+ for the backend.** (Go 1.23 以上を使用すること)
- **Run `corepack enable pnpm` before installation.** (`pnpm` 有効化を優先すること)
- **Copy `.env.example` to `.env` in each app directory.** (各アプリ直下に `.env` を作成すること)

## Linting & Formatting

- **Base ESLint on root `eslint.config.js`.** (ルートの ESLint 設定を基準にすること)
- **Run `pnpm run lint` for overall checks.** (全体チェックは `pnpm run lint` を実行すること)
- **Run `pnpm run fix` for auto-formatting.** (自動修正は `pnpm run fix` を実行すること)
- **Always update dependency arrays in React Hooks.** (`exhaustive-deps` に従い、依存配列を必ず更新すること)
- **Avoid `eslint-disable`; modify config instead.** (`eslint-disable` を避け、必要ならルール設定を検討すること)

## CI / PR Policy

- **Branch from `main` into `feature/*`, merge back to `main`.** (`main` から `feature/*` を切り、完了後に `main` へ戻すこと)
- **Require at least one LGTM before merge.** (マージ前に最低 1 名の承認を必須とすること)
- **Run `pnpm run lint` and `pnpm run typecheck` before opening PRs.** (PR 前に `pnpm run lint` と `pnpm run typecheck` を実行すること)
- **Use `pnpm run lint:report` when fixing lint; reference `docs/ESLint_Report.md`.** (Lint 修正時は `pnpm run lint:report` で出力した `docs/ESLint_Report.md` を参照すること)

## Lint Exceptions

- **Avoid `eslint-disable`; change config with rationale.** (`eslint-disable` は原則禁止。必要なら設定変更と理由を明記すること)
- **If temporary disable is unavoidable, scope minimally and add TODO with removal timing.** (一時的な無効化は最小範囲とし、撤去予定を TODO で示すこと)
- **Note any rule relaxation in PR description.** (ルール緩和は PR 説明に理由と影響範囲を記載すること)

## Screen & Navigation

- **Login: Use Supabase OAuth or guest mode.** (ログインは Supabase OAuth またはゲストモードを使用すること)
- **Owner: Use `/owner` path for management screens.** (管理画面は `/owner` 配下を使用すること)
- **Navigation: Update `docs/screen-flow.md` if routes change.** (ルーティング変更時は `screen-flow.md` を更新すること)

## Design & Styles

- **Source of Truth: `packages/theme/src/colors.ts`.** (色は `colors.ts` を正解とすること)
- **Use `ThemedText` and `ThemedView` for all components.** (共通コンポーネントを優先使用すること)
- **No inline styles or color literals.** (インラインスタイルやカラーコードの直書きを禁止すること)
- **Sort style keys alphabetically.** (スタイルのキーはアルファベット順に並べること)

## Restrictions

- **Do not modify `apps/web`.** (`apps/web` 配下は変更禁止)
- **No trailing slashes in `EXPO_PUBLIC_WEB_BASE_URL`.** (URL末尾にスラッシュを入れないこと)
