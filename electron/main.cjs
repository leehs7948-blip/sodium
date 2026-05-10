const { app, BrowserWindow, dialog } = require('electron');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');

let serverProc = null;
let dashboardProc = null;

function loadConfig() { return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config.json'), 'utf8')); }
function probe(url) { return new Promise((resolve) => { const req = http.get(url, (res) => { res.resume(); resolve(!!res.statusCode && res.statusCode < 500); }); req.on('error', () => resolve(false)); }); }
async function waitForUrl(url, timeoutMs = 30000) { const start = Date.now(); while (Date.now()-start < timeoutMs) { if (await probe(url)) return; await new Promise(r=>setTimeout(r,500)); } throw new Error(`Timeout waiting for ${url}`); }
function spawnManaged(name, command, args, options = {}) { const p = spawn(command,args,{cwd:options.cwd||process.cwd(),env:{...process.env,...(options.env||{})},stdio:['ignore','pipe','pipe']}); p.stdout.on('data',(b)=>process.stdout.write(`[${name}] ${b}`)); p.stderr.on('data',(b)=>process.stderr.write(`[${name}] ${b}`)); return p; }

async function createWindow() {
  const config = loadConfig();
  const dashboardPort = Number(process.env.DASHBOARD_PORT || config.dashboard.port || 3100);
  const dashboardUrl = `http://127.0.0.1:${dashboardPort}`;

  if (!(await probe(`${dashboardUrl}/health`))) {
    const dashboardCfg = config.dashboardApp || {};
    dashboardProc = spawnManaged('dashboard-backend', dashboardCfg.command || process.execPath, dashboardCfg.args || ['src/index.js'], { cwd: dashboardCfg.cwd || path.join(__dirname, '..'), env: { DASHBOARD_PORT: String(dashboardPort) } });
  }

  const serverCfg = config.sodiumServer || {};
  if (serverCfg.enabled === true) {
    serverProc = spawnManaged('sodium-server', serverCfg.command || 'java', serverCfg.args || ['-jar','server.jar','nogui'], { cwd: serverCfg.cwd || path.join(__dirname, '..') });
  }

  await waitForUrl(`${dashboardUrl}/health`, Number(config.dashboardApp?.healthTimeoutMs || 30000));
  const win = new BrowserWindow({ width: 1400, height: 900, title: 'Sodium Desktop', webPreferences: { contextIsolation: true } });
  await win.loadURL(dashboardUrl);
}

app.whenReady().then(async ()=>{ try{ await createWindow(); } catch(e){ dialog.showErrorBox('Startup failed', e.message); app.quit(); } });
app.on('window-all-closed', ()=>{ if (process.platform !== 'darwin') app.quit(); });
app.on('before-quit', ()=>{ if (dashboardProc && !dashboardProc.killed) dashboardProc.kill('SIGTERM'); if (serverProc && !serverProc.killed) serverProc.kill('SIGTERM'); });
