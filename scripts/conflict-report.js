const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const OUTPUT_PATH = path.join(ROOT, 'docs', 'Conflict_Report.md');
const IGNORED_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.next',
  '.expo',
]);

function isTextFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return !['.png', '.jpg', '.jpeg', '.gif', '.webp', '.pdf', '.zip'].includes(ext);
}

function walk(dir, files) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  entries.forEach(entry => {
    if (entry.name.startsWith('.DS_Store')) return;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) return;
      walk(fullPath, files);
      return;
    }
    files.push(fullPath);
  });
}

function findConflicts(content) {
  const lines = content.split(/\r?\n/);
  const conflicts = [];
  let i = 0;
  while (i < lines.length) {
    if (lines[i].startsWith('<<<<<<<')) {
      const start = i;
      let end = i + 1;
      while (end < lines.length && !lines[end].startsWith('>>>>>>>')) {
        end += 1;
      }
      if (end < lines.length) {
        conflicts.push({
          startLine: start + 1,
          endLine: end + 1,
          block: lines.slice(start, end + 1),
        });
        i = end + 1;
        continue;
      }
    }
    i += 1;
  }
  return conflicts;
}

function main() {
  const files = [];
  walk(ROOT, files);

  const reportItems = [];

  files.forEach(filePath => {
    if (path.resolve(filePath) === path.resolve(OUTPUT_PATH)) {
      return;
    }
    if (!isTextFile(filePath)) return;
    const content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes('<<<<<<<')) return;
    const conflicts = findConflicts(content);
    if (conflicts.length === 0) return;
    reportItems.push({ filePath, conflicts });
  });

  const lines = [];
  lines.push('# コンフリクトレポート');
  lines.push('');
  if (reportItems.length === 0) {
    lines.push('コンフリクトは見つかりませんでした。');
  } else {
    lines.push(`コンフリクト数: ${reportItems.length}ファイル`);
    lines.push('');
    reportItems.forEach(item => {
      const relPath = path.relative(ROOT, item.filePath).replace(/\\/g, '/');
      lines.push(`## ${relPath}`);
      lines.push('');
      item.conflicts.forEach((conflict, index) => {
        lines.push(`### 競合 ${index + 1}（${conflict.startLine}行目〜${conflict.endLine}行目）`);
        lines.push('');
        lines.push('```');
        conflict.block.forEach(line => {
          lines.push(line);
        });
        lines.push('```');
        lines.push('');
      });
    });
  }

  fs.writeFileSync(OUTPUT_PATH, lines.join('\n'), 'utf8');
  console.log(`Conflict report generated: ${OUTPUT_PATH}`);
}

main();
