import express from 'express';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Server } from 'socket.io';
import { Role } from './constants.js';

const DEFAULT_TARGETS = [Role.MAYOR, Role.TROUBLE];
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.join(__dirname, '..', 'config.json');

function readConfig() { return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')); }
function mergeConfig(base, patch) {
  return {
    ...base,
    minecraft: { ...base.minecraft, ...(patch.minecraft || {}) },
    bots: { ...base.bots, ...(patch.bots || {}) },
    processor: { ...base.processor, ...(patch.processor || {}) },
    sodiumServer: { ...base.sodiumServer, ...(patch.sodiumServer || {}) },
  };
}

export class DashboardServer {
  constructor(service, { port = 3100 } = {}) {
    this.service = service; this.port = port; this.app = express();
    this.server = http.createServer(this.app); this.io = new Server(this.server, { cors: { origin: '*' } });
  }

  start() {
    this.app.use(express.json());
    this.app.get('/health', (_req, res) => res.json({ ok: true }));
    this.app.get('/api/state', (_req, res) => res.json(this.service.getSnapshot()));

    this.app.post('/api/control', async (req, res) => {
      const { text, source = 'owner', targets = DEFAULT_TARGETS } = req.body ?? {};
      if (typeof text !== 'string' || !text.trim()) return res.status(400).json({ error: 'text is required' });
      return this.runAndBroadcast(res, () => this.service.submitRequest({ source, text, targets }));
    });
    this.app.post('/api/manual', async (req, res) => this.runAndBroadcast(res, () => this.service.enqueueManualAction(req.body ?? {})));
    this.app.post('/api/playbook', async (req, res) => this.runAndBroadcast(res, () => this.service.enqueueDirectorPlaybook(req.body?.eventName)));
    this.app.post('/api/emergency-stop', async (_req, res) => this.runAndBroadcast(res, async () => { await this.service.emergencyStop(); return 0; }));
    this.app.post('/api/reconnect', async (req, res) => this.runAndBroadcast(res, async () => {
      if (req.body?.all) await this.service.reconnectAll(); else await this.service.reconnectBot(req.body?.botId);
      return 0;
    }));

    this.app.get('/api/config', (_req, res) => res.json(readConfig()));
    this.app.post('/api/config', (req, res) => {
      const current = readConfig();
      const next = mergeConfig(current, req.body || {});
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(next, null, 2));
      res.json({ ok: true, message: '설정 저장 완료. 재시작 후 적용됩니다.' });
    });

    this.app.post('/api/processor-test', async (_req, res) => {
      try {
        await this.service.submitRequest({ source: 'owner', text: '연결 테스트', targets: [] });
        res.json({ ok: true });
      } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
      }
    });

    this.app.get('/', (_req, res) => res.sendFile(path.join(__dirname, 'dashboard-ui.html')));

    this.io.on('connection', (socket) => socket.emit('state', this.service.getSnapshot()));
    return new Promise((resolve) => this.server.listen(this.port, () => resolve()));
  }

  async runAndBroadcast(res, run) {
    try {
      const queued = await run();
      await this.service.drain();
      this.io.emit('state', this.service.getSnapshot());
      res.json({ queued });
    } catch (error) {
      this.service.logger.log({ event: 'dashboard_control_error', reason: error.message });
      res.status(500).json({ error: error.message });
    }
  }
}
