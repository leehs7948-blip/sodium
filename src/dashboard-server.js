import express from 'express';
import http from 'node:http';
import { Server } from 'socket.io';

export class DashboardServer {
  constructor(service, { port = 3100 } = {}) {
    this.service = service;
    this.port = port;
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new Server(this.server, { cors: { origin: '*' } });
  }

  start() {
    this.app.use(express.json());

    this.app.get('/health', (_req, res) => res.json({ ok: true }));

    this.app.get('/api/state', (_req, res) => {
      res.json(this.service.getSnapshot());
    });

    this.app.post('/api/control', async (req, res) => {
      const { text, source = 'owner', targets = ['bot_mayor', 'bot_trouble'] } = req.body ?? {};
      if (typeof text !== 'string' || !text.trim()) {
        res.status(400).json({ error: 'text is required' });
        return;
      }

      try {
        const count = await this.service.submitRequest({ source, text, targets });
        await this.service.drain();
        this.io.emit('state', this.service.getSnapshot());
        res.json({ queued: count });
      } catch (error) {
        this.service.logger.log({ event: 'dashboard_control_error', reason: error.message });
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/', (_req, res) => {
      res.type('html').send(`<!doctype html>
<html><head><meta charset="utf-8"><title>Sodium Dashboard</title>
<style>body{font-family:sans-serif;max-width:960px;margin:24px auto;padding:0 12px}textarea{width:100%;height:120px}.row{display:flex;gap:8px}button{padding:8px 12px}pre{background:#111;color:#0f0;padding:12px;min-height:180px;overflow:auto}</style>
</head><body>
<h2>Sodium Bot Dashboard</h2>
<p>두 봇 동시 제어: 요청은 항상 ExternalProcessor 경유</p>
<textarea id="text" placeholder="예: 둘 다 앞으로 이동 후 대기"></textarea>
<div class="row"><button onclick="send(['bot_mayor','bot_trouble'])">두 봇 실행</button><button onclick="send(['bot_mayor'])">시장만</button><button onclick="send(['bot_trouble'])">사건만</button></div>
<h3>State</h3><pre id="state"></pre><h3>Logs</h3><pre id="logs"></pre>
<script src="/socket.io/socket.io.js"></script>
<script>
const stateEl=document.getElementById('state');
const logsEl=document.getElementById('logs');
async function refresh(){const r=await fetch('/api/state');const d=await r.json();render(d);} 
function render(d){stateEl.textContent=JSON.stringify(d.state,null,2);logsEl.textContent=d.logs.map(x=>JSON.stringify(x)).join('\n');}
async function send(targets){const text=document.getElementById('text').value;await fetch('/api/control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,targets})});await refresh();}
const ioClient=io();ioClient.on('state',render);refresh();
</script></body></html>`);
    });

    this.io.on('connection', (socket) => {
      socket.emit('state', this.service.getSnapshot());
    });

    return new Promise((resolve) => {
      this.server.listen(this.port, () => resolve());
    });
  }
}
