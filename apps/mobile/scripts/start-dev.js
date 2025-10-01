#!/usr/bin/env node
const { spawn } = require('child_process');
const net = require('net');
const path = require('path');

const DEFAULT_PORT = parseInt(process.env.EXPO_PORT || '19000', 10);
const MAX_ATTEMPTS = parseInt(process.env.EXPO_PORT_ATTEMPTS || '10', 10);
const PNPM_BIN = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const MOBILE_DIR = path.join('apps', 'mobile');

async function findAvailablePort(startPort, attempts) {
  let current = startPort;
  for (let i = 0; i < attempts; i += 1) {
    const candidate = await new Promise((resolve, reject) => {
      const server = net.createServer();
      server.once('error', (err) => {
        server.close();
        if (err.code === 'EADDRINUSE') {
          resolve(null);
        } else {
          reject(err);
        }
      });
      server.once('listening', () => {
        server.close(() => resolve(current));
      });
      server.listen(current, '0.0.0.0');
    });

    if (candidate !== null) {
      if (candidate !== startPort) {
        console.log(`[expo] Port ${startPort} busy; switching to ${candidate}`);
      }
      return candidate;
    }

    current += 1;
  }

  throw new Error(`no free port after ${attempts} attempts starting from ${startPort}`);
}

(async () => {
  let port;
  try {
    port = await findAvailablePort(DEFAULT_PORT, MAX_ATTEMPTS);
  } catch (err) {
    console.error(`Failed to find open port for Expo: ${err.message}`);
    process.exit(1);
    return;
  }

  const args = ['--dir', MOBILE_DIR, 'exec', 'expo', 'start', '--port', String(port)];
  const child = spawn(PNPM_BIN, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      EXPO_NO_INTERACTIVE: 'true',
    },
  });

  child.on('error', (err) => {
    console.error(`Failed to launch pnpm: ${err.message}`);
    process.exit(err.errno ?? 1);
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });
})();
