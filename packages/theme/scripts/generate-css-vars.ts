/**
 * CSS変数自動生成スクリプト
 *
 * @team/theme の colors.ts から Web用のCSS変数ファイルを生成します。
 *
 * 使用方法:
 *   pnpm --filter @team/theme generate:css
 *
 * 出力先:
 *   apps/web/app/theme-vars.css
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import { colors, semanticColors, textOn } from '../src/colors.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// withAlpha関数をここで再実装（ESM importの問題を回避）
function withAlpha(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  const full =
    normalized.length === 3
      ? normalized
          .split('')
          .map((c) => c + c)
          .join('')
      : normalized;
  const int = parseInt(full, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const cssContent = `/**
 * ============================================================================
 * AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
 * ============================================================================
 *
 * このファイルは @team/theme/scripts/generate-css-vars.ts によって自動生成されています。
 * 手動で編集しないでください。
 *
 * カラー値を変更する場合は @team/theme/src/colors.ts を編集し、
 * 以下のコマンドで再生成してください:
 *
 *   pnpm --filter @team/theme generate:css
 *
 * ============================================================================
 * WEB専用
 * ============================================================================
 *
 * このCSSファイルはWeb (Next.js) 専用です。
 * React Native (Mobile) では CSS変数が使用できないため、
 * @team/theme のTypeScript定義を直接インポートして使用してください。
 *
 * Mobile での使用例:
 *   import { colors, textOn } from '@team/theme';
 *   <View style={{ backgroundColor: colors.primary }} />
 *
 * ============================================================================
 * Generated at: ${new Date().toISOString()}
 * ============================================================================
 */

:root {
  /* ========================================
   * Core Colors
   * @team/theme/src/colors.ts > colors
   * ======================================== */
  --color-primary: ${colors.primary};
  --color-secondary: ${colors.secondary};
  --color-accent: ${colors.accent};
  --color-background: ${colors.background};

  /* ========================================
   * Text Colors (on surfaces)
   * @team/theme/src/colors.ts > textOn
   * ======================================== */
  --text-on-primary: ${textOn.primary};
  --text-on-secondary: ${textOn.secondary};
  --text-on-accent: ${textOn.accent};
  --text-on-background: ${textOn.background};

  /* ========================================
   * Semantic Colors - Error
   * @team/theme/src/colors.ts > semanticColors.error
   * ======================================== */
  --color-error-light: ${semanticColors.error.light};
  --color-error-medium: ${semanticColors.error.medium};
  --color-error-base: ${semanticColors.error.base};
  --color-error-dark: ${semanticColors.error.dark};

  /* ========================================
   * Semantic Colors - Success & Warning
   * @team/theme/src/colors.ts > semanticColors
   * ======================================== */
  --color-success: ${semanticColors.success.base};
  --color-warning: ${semanticColors.warning.base};

  /* ========================================
   * Provider Colors
   * @team/theme/src/colors.ts > semanticColors.providers
   * ======================================== */
  --color-provider-google: ${semanticColors.providers.google};
  --color-provider-apple: ${semanticColors.providers.apple};

  /* ========================================
   * Alpha Variants (commonly used)
   * ======================================== */
  --color-primary-10: ${withAlpha(colors.primary, 0.1)};
  --color-primary-20: ${withAlpha(colors.primary, 0.2)};
  --color-primary-75: ${withAlpha(colors.primary, 0.75)};
  --color-secondary-90: ${withAlpha(colors.secondary, 0.9)};
  --color-background-80: ${withAlpha(colors.background, 0.8)};
  --color-background-90: ${withAlpha(colors.background, 0.9)};

  /* ========================================
   * Legacy Variables (backwards compatibility)
   * ======================================== */
  --background: var(--color-background);
  --foreground: var(--text-on-background);
}
`;

// 出力先ディレクトリ
const outputPath = path.resolve(__dirname, '../../../apps/web/app/theme-vars.css');

// ディレクトリが存在しない場合は作成
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// ファイル書き込み
fs.writeFileSync(outputPath, cssContent, 'utf-8');

console.log(`✅ Generated: ${outputPath}`);
