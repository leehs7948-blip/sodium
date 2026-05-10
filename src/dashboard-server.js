import express from 'express';
import http from 'node:http';
import { Server } from 'socket.io';
import { Role } from './constants.js';

const DEFAULT_TARGETS = [Role.MAYOR, Role.TROUBLE];

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
    this.app.get('/api/state', (_req, res) => res.json(this.service.getSnapshot()));

    this.app.post('/api/control', async (req, res) => {
      const { text, source = 'owner', targets = DEFAULT_TARGETS } = req.body ?? {};
      if (typeof text !== 'string' || !text.trim()) return res.status(400).json({ error: 'text is required' });
      return this.runAndBroadcast(res, () => this.service.submitRequest({ source, text, targets }));
    });

    this.app.post('/api/manual', async (req, res) => {
      const { botId, type, params = {} } = req.body ?? {};
      return this.runAndBroadcast(res, () => this.service.enqueueManualAction({ botId, type, params }));
    });

    this.app.post('/api/playbook', async (req, res) => {
      const { eventName } = req.body ?? {};
      return this.runAndBroadcast(res, () => this.service.enqueueDirectorPlaybook(eventName));
    });

    this.app.post('/api/emergency-stop', (_req, res) => {
      this.service.emergencyStop();
      this.io.emit('state', this.service.getSnapshot());
      res.json({ ok: true });
    });

    this.app.get('/', (_req, res) => {
      res.type('html').send(`<!doctype html><html><head><meta charset="utf-8"><title>Sodium Dashboard</title>
<style>body{font-family:sans-serif;max-width:1100px;margin:24px auto;padding:0 12px}.row{display:flex;gap:8px;flex-wrap:wrap}textarea{width:100%;height:80px}button{padding:8px 10px}.danger{background:#b30000;color:#fff}pre{background:#111;color:#0f0;padding:12px;min-height:140px;overflow:auto}</style>
</head><body><h2>Sodium Bot Dashboard</h2>
<textarea id="text" placeholder="AI 요청 텍스트"></textarea>
<div class="row"><button onclick="ai(['bot_mayor','bot_trouble'])">AI 두 봇</button><button onclick="ai(['bot_mayor'])">AI 시장</button><button onclick="ai(['bot_trouble'])">AI 사건</button><button class="danger" onclick="stopAll()">긴급 정지</button></div>
<h3>수동 조작</h3><div class="row"><button onclick="manual('bot_mayor','look_at',{target:'main_stage'})">시장 LOOK</button><button onclick="manual('bot_trouble','move_local',{profile:{direction:'forward',durationMs:800,label:'manual'}})">사건 MOVE</button><button onclick="manual('bot_mayor','move_to',{position:{x:0,y:64,z:0,range:1}})">시장 MOVE_TO</button></div>
<h3>Director Playbook</h3><div class="row"><button onclick="playbook('festival_start')">festival_start</button><button onclick="playbook('emergency_meeting')">emergency_meeting</button><button onclick="playbook('resource_shortage')">resource_shortage</button></div>
<h3>State</h3><pre id="state"></pre><h3>AI Debug</h3><pre id="ai"></pre><h3>Logs</h3><pre id="logs"></pre>
<script src="/socket.io/socket.io.js"></script><script>
const stateEl=document.getElementById('state');const logsEl=document.getElementById('logs');const aiEl=document.getElementById('ai');
function render(d){stateEl.textContent=JSON.stringify(d.state,null,2);aiEl.textContent=JSON.stringify(d.aiDebug,null,2);logsEl.textContent=d.logs.map(x=>JSON.stringify(x)).join('\n');}
async function refresh(){const r=await fetch('/api/state');render(await r.json());}
async function ai(targets){await fetch('/api/control',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:document.getElementById('text').value,targets})});refresh();}
async function manual(botId,type,params){await fetch('/api/manual',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({botId,type,params})});refresh();}
async function playbook(eventName){await fetch('/api/playbook',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({eventName})});refresh();}
async function stopAll(){await fetch('/api/emergency-stop',{method:'POST'});refresh();}
const s=io();s.on('state',render);refresh();
</script></body></html>`);
    });

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
