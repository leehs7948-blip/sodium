import fs from 'node:fs';

const checks = [];
function ok(name, detail) { checks.push({ ok: true, name, detail }); }
function fail(name, detail) { checks.push({ ok: false, name, detail }); }

try {
  const cfg = JSON.parse(fs.readFileSync(new URL('../config.json', import.meta.url), 'utf8'));
  if (!cfg.minecraft?.host) fail('config.minecraft.host', 'missing'); else ok('config.minecraft.host', cfg.minecraft.host);
  if (!cfg.dashboard?.port) fail('config.dashboard.port', 'missing'); else ok('config.dashboard.port', String(cfg.dashboard.port));
} catch (e) {
  fail('config.json', e.message);
}

for (const pkg of ['mineflayer', 'express', 'socket.io']) {
  try { await import(pkg); ok(`dependency:${pkg}`, 'installed'); } catch (e) { fail(`dependency:${pkg}`, e.message); }
}

for (const row of checks) console.log(`${row.ok ? '✅' : '❌'} ${row.name} - ${row.detail}`);
if (checks.some((c) => !c.ok)) process.exitCode = 1;
