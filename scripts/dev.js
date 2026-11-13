#!/usr/bin/env node

const { spawn } = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const serverDir = path.join(rootDir, 'server');
const clientDir = path.join(rootDir, 'client');

function readEnvValue(filePaths, key) {
  for (const filePath of filePaths) {
    if (!fs.existsSync(filePath)) continue;
    const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const match = line.match(new RegExp('^\\s*' + key + '\\s*=\\s*(.*?)\\s*$'));
      if (!match) continue;
      let value = match[1].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      } else {
        value = value.replace(/\\s+#.*$/, '').trim();
      }
      if (value) return value;
    }
  }
  return '';
}

const envFiles = [
  path.join(serverDir, '.env.development'),
  path.join(serverDir, '.env')
];
const backendPort = Number(process.env.PORT || readEnvValue(envFiles, 'PORT') || 3001);
const backendHost = '127.0.0.1';
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const children = [];
let shuttingDown = false;

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (child && child.exitCode === null && child.signalCode === null) {
      child.kill();
    }
  }
  process.exitCode = code;
}

function startApp(name, cwd) {
  const child = spawn(npmCommand, ['run', 'dev'], {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });
  children.push(child);
  child.on('error', (error) => {
    console.error('[TradeLink] Could not start ' + name + ': ' + error.message);
    shutdown(1);
  });
  child.on('exit', (code, signal) => {
    if (!shuttingDown) {
      console.error('[TradeLink] ' + name + ' stopped' + (signal ? ' (' + signal + ')' : ' (exit ' + code + ')') + '. Stopping the other app.');
      shutdown(code && code !== 0 ? code : 1);
    }
  });
  return child;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function checkBackend() {
  return new Promise((resolve, reject) => {
    const request = http.get({
      hostname: backendHost,
      port: backendPort,
      path: '/',
      timeout: 1500
    }, (response) => {
      response.resume();
      resolve(response.statusCode === 200);
    });
    request.on('timeout', () => request.destroy(new Error('Backend health check timed out')));
    request.on('error', reject);
  });
}

async function waitForBackend(child) {
  const deadline = Date.now() + 45000;
  while (Date.now() < deadline) {
    if (shuttingDown || child.exitCode !== null || child.signalCode !== null) {
      throw new Error('Backend process exited before becoming healthy.');
    }
    try {
      if (await checkBackend()) return;
    } catch {
      // The backend may need a few seconds to initialize.
    }
    await delay(500);
  }
  throw new Error(
    'Backend did not respond at http://' + backendHost + ':' + backendPort +
    '/ within 45 seconds. Check server/.env and the backend terminal output.'
  );
}

async function main() {
  if (!fs.existsSync(path.join(serverDir, 'node_modules'))) {
    throw new Error('Backend dependencies are missing. Run: npm install --prefix server');
  }
  if (!fs.existsSync(path.join(clientDir, 'node_modules'))) {
    throw new Error('Client dependencies are missing. Run: npm install --prefix client');
  }

  if (!fs.existsSync(path.join(serverDir, '.env'))) {
    console.warn('[TradeLink] server/.env is missing. Copy server/.env.example to server/.env and configure it before using database-backed routes.');
  }
  if (!fs.existsSync(path.join(clientDir, '.env'))) {
    console.warn('[TradeLink] client/.env is missing. Copy client/.env.example to client/.env; safe defaults will be used.');
  }

  console.log('[TradeLink] Starting backend on port ' + backendPort + '...');
  const backend = startApp('Backend', serverDir);
  await waitForBackend(backend);

  if (shuttingDown) return;
  console.log('[TradeLink] Backend health check passed. Starting student web app...');
  console.log('[TradeLink] Open http://localhost:5173');
  startApp('Student web app', clientDir);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

main().catch((error) => {
  console.error('[TradeLink] ' + error.message);
  shutdown(1);
});
