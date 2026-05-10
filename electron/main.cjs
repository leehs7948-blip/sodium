const { app, BrowserWindow, dialog } = require('electron');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');

let serverProc = null;
let dashboardProc = null;

function loadConfig() {
  const configPath = path.join(__dirname, '..', 'config.json');
  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

function waitForUrl(url, timeoutMs = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const probe = () => {
      const req = http.get(url, (res) => {
        res.resume();
        if (res.statusCode && res.statusCode < 500) resolve();
        else retry();
      });
      req.on('error', retry);
    };
    const retry = () => {
      if (Date.now() - start > timeoutMs) reject(new Error(`Timeout waiting for ${url}`));
      else setTimeout(probe, 500);
    };
    probe();
  });
}

function spawnManaged(name, command, args, options = {}) {
  const proc = spawn(command, args, {
    cwd: options.cwd || process.cwd(),
    env: { ...process.env, ...(options.env || {}) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  proc.stdout.on('data', (buf) => process.stdout.write(`[${name}] ${buf}`));
  proc.stderr.on('data', (buf) => process.stderr.write(`[${name}] ${buf}`));
  proc.on('exit', (code) => process.stdout.write(`[${name}] exited (${code})\n`));
  return proc;
}

async function createWindow() {
  const config = loadConfig();
  const dashboardPort = Number(process.env.DASHBOARD_PORT || config.dashboard.port || 3100);
  const dashboardUrl = `http://127.0.0.1:${dashboardPort}`;

  const serverCfg = config.sodiumServer || {};
  const dashboardCfg = config.dashboardApp || {};

  if (serverCfg.enabled !== false) {
    const command = serverCfg.command || 'java';
    const args = serverCfg.args || ['-jar', 'server.jar', 'nogui'];
    serverProc = spawnManaged('sodium-server', command, args, { cwd: serverCfg.cwd || path.join(__dirname, '..') });
  }

  dashboardProc = spawnManaged(
    'dashboard-backend',
    dashboardCfg.command || process.execPath,
    dashboardCfg.args || ['src/index.js'],
    { cwd: dashboardCfg.cwd || path.join(__dirname, '..'), env: { DASHBOARD_PORT: String(dashboardPort) } },
  );

  await waitForUrl(`${dashboardUrl}/health`, Number(dashboardCfg.healthTimeoutMs || 30000));

  const win = new BrowserWindow({ width: 1400, height: 900, webPreferences: { contextIsolation: true } });
  await win.loadURL(dashboardUrl);
}

app.whenReady().then(async () => {
  try {
    await createWindow();
  } catch (error) {
    dialog.showErrorBox('Startup failed', error.message);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (dashboardProc && !dashboardProc.killed) dashboardProc.kill('SIGTERM');
  if (serverProc && !serverProc.killed) serverProc.kill('SIGTERM');
});
