#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '../../..');
const mobileDir = path.join(repoRoot, 'apps', 'mobile');
const typesFile = path.join(mobileDir, '.expo', 'types', 'router.d.ts');

function hasRoute(typeFileText, route) {
  return typeFileText.includes(`"${route}"`) || typeFileText.includes("`" + route + "`");
}

function patchFile(file, replacers) {
  const src = fs.readFileSync(file, 'utf8');
  let next = src;
  for (const [pattern, replacement] of replacers) {
    next = next.replace(pattern, replacement);
  }
  if (next !== src) {
    fs.writeFileSync(file, next, 'utf8');
    return true;
  }
  return false;
}

function main() {
  if (!fs.existsSync(typesFile)) {
    console.error('[cleanup] types file not found:', typesFile);
    process.exit(1);
  }
  const text = fs.readFileSync(typesFile, 'utf8');

  const needed = ['/login', '/owner', '/owner/signup', '/auth/callback'];
  const missing = needed.filter((r) => !hasRoute(text, r));
  if (missing.length) {
    console.log('[cleanup] routes missing in types, skip:', missing.join(', '));
    process.exit(0);
  }

  // login.tsx
  const loginFile = path.join(mobileDir, 'app', 'login.tsx');
  patchFile(loginFile, [
    [/import\s+\{\s*useRouter,\s*type\s+Href\s*\}\s+from\s+'expo-router';/, "import { useRouter } from 'expo-router';"],
    [/\s+as\s+Href\)/g, ')'],
  ]);

  // owner/index.tsx
  const ownerIndex = path.join(mobileDir, 'app', 'owner', 'index.tsx');
  patchFile(ownerIndex, [
    [/import\s+\{\s*useRouter,\s*type\s+Href\s*\}\s+from\s+'expo-router';/, "import { useRouter } from 'expo-router';"],
    [/\s+as\s+Href\)/g, ')'],
  ]);

  console.log('[cleanup] casts removed if present.');
}

try {
  main();
} catch (e) {
  console.error('[cleanup] failed:', e?.message || e);
  process.exit(1);
}

