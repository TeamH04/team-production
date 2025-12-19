// scripts/run-eslint-json.mjs
import { exec } from 'node:child_process';
import fs from 'node:fs';

const pattern = process.argv[2] ?? '"**/*.{ts,tsx,js,jsx}"';
const output = process.argv[3] ?? 'reports/eslint.json';
const cmd = `pnpm -w exec eslint ${pattern} -f json -o ${output}`;

console.log(`[lint:report] ${cmd}`);
const child = exec(cmd, { shell: true });

child.stdout?.pipe(process.stdout);
child.stderr?.pipe(process.stderr);

child.on('exit', code => {
  // 失敗コードでもファイルは出ていることが多いので、常に整形を試みる
  try {
    const raw = fs.readFileSync(output, 'utf8');
    const pretty = JSON.stringify(JSON.parse(raw), null, 2); // ← ここで整形
    fs.writeFileSync(output, pretty + '\n');
    console.log(`[lint:report] prettified ${output}`);
  } catch (e) {
    console.warn(`[lint:report] could not prettify ${output}:`, e?.message ?? e);
  }
  // 失敗してもCIを落とさない方針
  process.exit(0);
});
