import { ActionType, Role } from './constants.js';
import { ExternalProcessor } from './external-processor.js';

const ALLOWED_ROLES = new Set([Role.MAYOR, Role.TROUBLE]);
const ALLOWED_ACTIONS = new Set(Object.values(ActionType));
const CONTROLS = ['forward', 'back', 'left', 'right', 'jump', 'sprint', 'sneak'];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function normalizeAction(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const { botId, type } = raw;
  const params = raw.params ?? {};
  if (!ALLOWED_ROLES.has(botId) || !ALLOWED_ACTIONS.has(type)) return null;

  if (type === ActionType.MOVE_LOCAL) {
    const p = params.profile;
    if (!p || typeof p !== 'object') return null;
    if (p.direction != null && !['forward', 'back', 'left', 'right', 'jump'].includes(p.direction)) return null;
    const d = Number(p.durationMs ?? 800);
    if (!Number.isFinite(d) || d < 100 || d > 10_000) return null;
  }
  if (type === ActionType.LOOK_AT && !params.target) return null;
  if (type === ActionType.MOVE_TO) {
    const pos = params.position;
    if (!pos || !Number.isFinite(Number(pos.x)) || !Number.isFinite(Number(pos.y)) || !Number.isFinite(Number(pos.z))) return null;
  }
  if (type === ActionType.CONTROL_STATE) {
    if (!CONTROLS.includes(params.control) || typeof params.state !== 'boolean') return null;
  }
  if (type === ActionType.HOTBAR_SELECT) {
    const slot = Number(params.slot);
    if (!Number.isInteger(slot) || slot < 0 || slot > 8) return null;
  }
  if (type === ActionType.USE_ITEM) {
    const durationMs = Number(params.durationMs ?? 200);
    if (!Number.isFinite(durationMs) || durationMs < 50 || durationMs > 60_000) return null;
  }
  if (type === ActionType.DIG_BLOCK) {
    const maxMs = Number(params.maxMs ?? 8_000);
    if (!Number.isFinite(maxMs) || maxMs < 500 || maxMs > 60_000) return null;
  }
  if (type === ActionType.WAIT && typeof params.seconds !== 'number') return null;
  return { botId, type, params };
}

function parseActionsFromResponse(json) {
  const actions = json?.actions ?? json?.result?.actions ?? [];
  if (!Array.isArray(actions)) return [];
  return actions.map(normalizeAction).filter(Boolean);
}

export class RealExternalProcessor extends ExternalProcessor {
  constructor({ endpoint, model, timeoutMs = 4000, maxRetries = 2 } = {}) {
    super();
    this.endpoint = endpoint;
    this.model = model;
    this.timeoutMs = timeoutMs;
    this.maxRetries = maxRetries;
  }

  async createPlan(request) {
    if (!this.endpoint) throw new Error('RealExternalProcessor requires endpoint');
    const prompt = {
      source: request?.source ?? 'unknown',
      text: request?.text ?? '',
      allowed_roles: [...ALLOWED_ROLES],
      allowed_actions: [...ALLOWED_ACTIONS],
      output_schema: {
        actions: [{
          botId: 'bot_mayor|bot_trouble',
          type: [...ALLOWED_ACTIONS].join('|'),
          params: {
            profile: { direction: 'forward|back|left|right|jump', durationMs: 800, label: 'optional' },
            target: 'main_stage',
            position: { x: 0, y: 64, z: 0, range: 1 },
            control: 'forward|back|left|right|jump|sprint|sneak',
            state: true,
            slot: 0,
            durationMs: 300,
            maxMs: 8000,
            seconds: 1,
          },
        }],
      },
    };

    let lastError;
    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const response = await fetch(this.endpoint, {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ model: this.model, input: prompt }), signal: controller.signal,
        });
        if (!response.ok) throw new Error(`processor http error: ${response.status}`);
        return parseActionsFromResponse(await response.json());
      } catch (error) {
        lastError = error;
        if (attempt < this.maxRetries) await sleep(120 * (attempt + 1));
      } finally { clearTimeout(timeoutId); }
    }
    throw new Error(`processor failed after retries: ${lastError?.message ?? 'unknown'}`);
  }
}

export const __private = { normalizeAction, parseActionsFromResponse };
