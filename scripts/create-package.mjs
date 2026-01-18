#!/usr/bin/env node
/**
 * @team パッケージ生成スクリプト
 *
 * 使用方法:
 *   node scripts/create-package.mjs <package-name> [--with-test]
 *
 * 例:
 *   node scripts/create-package.mjs date-utils
 *   node scripts/create-package.mjs date-utils --with-test
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const PACKAGES_DIR = join(import.meta.dirname, "..", "packages");

// 標準的なpackage.json テンプレート（DRY原則に基づく共通設定）
const createPackageJson = (name, withTest) => ({
  name: `@team/${name}`,
  version: "0.0.1",
  private: true,
  type: "module",
  main: "./src/index.ts",
  types: "./src/index.ts",
  exports: {
    ".": {
      types: "./src/index.ts",
      default: "./src/index.ts",
    },
  },
  scripts: {
    typecheck: "tsc --noEmit",
    ...(withTest && {
      test: "node --import tsx --test src/__tests__/*.test.ts",
    }),
  },
  ...(withTest && {
    devDependencies: {
      tsx: "^4.21.0",
    },
  }),
});

// tsconfig.json テンプレート
const tsconfigJson = {
  extends: "../../tsconfig.base.json",
  compilerOptions: {
    outDir: "./dist",
    rootDir: "./src",
  },
  include: ["src/**/*"],
  exclude: ["node_modules", "dist"],
};

// index.ts テンプレート
const indexTs = (name) => `// @team/${name}
// このファイルからパッケージのAPIをエクスポートしてください

export {};
`;

// テストファイル テンプレート
const testTs = (name) => `import { describe, it } from "node:test";
import assert from "node:assert";

describe("@team/${name}", () => {
  it("should work", () => {
    assert.ok(true);
  });
});
`;

async function main() {
  const args = process.argv.slice(2);
  const packageName = args.find((arg) => !arg.startsWith("--"));
  const withTest = args.includes("--with-test");

  if (!packageName) {
    console.error("使用方法: node scripts/create-package.mjs <package-name> [--with-test]");
    process.exit(1);
  }

  // パッケージ名のバリデーション
  if (!/^[a-z][a-z0-9-]*$/.test(packageName)) {
    console.error("パッケージ名は小文字英数字とハイフンのみ使用可能です（先頭は英字）");
    process.exit(1);
  }

  const packageDir = join(PACKAGES_DIR, packageName);
  const srcDir = join(packageDir, "src");

  try {
    // ディレクトリ作成
    await mkdir(srcDir, { recursive: true });

    if (withTest) {
      await mkdir(join(srcDir, "__tests__"), { recursive: true });
    }

    // ファイル作成
    await writeFile(
      join(packageDir, "package.json"),
      JSON.stringify(createPackageJson(packageName, withTest), null, 2) + "\n"
    );

    await writeFile(
      join(packageDir, "tsconfig.json"),
      JSON.stringify(tsconfigJson, null, 2) + "\n"
    );

    await writeFile(join(srcDir, "index.ts"), indexTs(packageName));

    if (withTest) {
      await writeFile(
        join(srcDir, "__tests__", `${packageName}.test.ts`),
        testTs(packageName)
      );
    }

    console.log(`✓ パッケージ @team/${packageName} を作成しました`);
    console.log(`  場所: packages/${packageName}/`);
    console.log("");
    console.log("次のステップ:");
    console.log("  1. pnpm install を実行してワークスペースを更新");
    console.log(`  2. packages/${packageName}/src/index.ts を編集`);

    if (withTest) {
      console.log(`  3. pnpm --filter @team/${packageName} test でテスト実行`);
    }
  } catch (error) {
    console.error("パッケージ作成に失敗しました:", error.message);
    process.exit(1);
  }
}

main();
