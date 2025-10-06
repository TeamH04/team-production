#!/usr/bin/env node
const { spawn } = require('child_process');
const net = require('net');
const path = require('path');

const PNPM_BIN = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const REPO_ROOT = path.resolve(__dirname, '../../..');
const MOBILE_DIR = path.join(REPO_ROOT, 'apps', 'mobile');

const EXPO_START = parseInt(process.env.EXPO_PORT || '19000', 10);
const EXPO_ATTEMPTS = parseInt(process.env.EXPO_PORT_ATTEMPTS || '10', 10);
const METRO_START = parseInt(process.env.METRO_PORT || '8081', 10);
const METRO_ATTEMPTS = parseInt(process.env.METRO_PORT_ATTEMPTS || '10', 10);

function isFree(port, host = '0.0.0.0') {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => server.close(() => resolve(true)));
    server.listen(port, host);
  });
}

async function findFree(start, attempts, host) {
  for (let port = start, tried = 0; tried < attempts; port += 1, tried += 1) {
    if (await isFree(port, host)) return port;
  }
  throw new Error(`no free port after ${attempts} tries from ${start}`);
}

(async () => {
  try {
    const expoPort = await findFree(EXPO_START, EXPO_ATTEMPTS, '0.0.0.0');
    const metroPort = await findFree(METRO_START, METRO_ATTEMPTS, '0.0.0.0');
    console.log(`[start-dev] expoPort=${expoPort} metroPort=${metroPort}`);

    const args = [
      '--dir', MOBILE_DIR,
      'exec', 'expo', 'start',
      '--non-interactive',
      '--port', String(expoPort),
      '--metro-port', String(metroPort),
    ];

    const child = spawn(PNPM_BIN, args, {
      cwd: REPO_ROOT,
      stdio: 'inherit',
      shell: process.platform === 'win32',
      env: {
        ...process.env,
        EXPO_NO_INTERACTIVE: '1',
        EXPO_DEV_SERVER_PORT: String(expoPort),
        EXPO_METRO_LISTEN_PORT: String(metroPort),
      },
    });

    child.on('error', (err) => {
      console.error('[start-dev] spawn error:', err);
      process.exit(err.errno ?? 1);
    });

    child.on('exit', (code, signal) => {
      if (signal) {
        process.kill(process.pid, signal);
        return;
      }
      process.exit(code ?? 0);
    });
  } catch (error) {
    console.error('[start-dev] fatal:', error.message);
    process.exit(1);
  }
})();
