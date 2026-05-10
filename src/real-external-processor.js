import { ActionType, Role } from './constants.js';
import { ExternalProcessor } from './external-processor.js';

const ALLOWED_ROLES = new Set([Role.MAYOR, Role.TROUBLE]);
const ALLOWED_ACTIONS = new Set([ActionType.MOVE_LOCAL, ActionType.LOOK_AT, ActionType.WAIT, ActionType.MOVE_TO]);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function normalizeAction(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const botId = raw.botId;
  const type = raw.type;
  const params = raw.params ?? {};

  if (!ALLOWED_ROLES.has(botId)) return null;
  if (!ALLOWED_ACTIONS.has(type)) return null;

  if (type === ActionType.MOVE_LOCAL) {
    const profile = params.profile;
    if (!profile || typeof profile !== 'object') return null;
    if (profile.direction != null && !['forward', 'back', 'left', 'right', 'jump'].includes(profile.direction)) {
      return null;
    }
    const durationMs = Number(profile.durationMs ?? 800);
    if (!Number.isFinite(durationMs) || durationMs < 100 || durationMs > 10_000) return null;
  }
  if (type === ActionType.LOOK_AT && typeof params.target !== 'string') return null;
  if (type === ActionType.MOVE_TO) {
    const pos = params.position;
    if (!pos || !Number.isFinite(Number(pos.x)) || !Number.isFinite(Number(pos.y)) || !Number.isFinite(Number(pos.z))) return null;
  }
  if (type === ActionType.WAIT && typeof params.seconds !== 'number') return null;

  return { botId, type, params };
}

function parseActionsFromResponse(json) {
  const actions = json?.actions ?? json?.result?.actions ?? [];
  if (!Array.isArray(actions)) return [];

  return actions
    .map(normalizeAction)
    .filter(Boolean);
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
    if (!this.endpoint) {
      throw new Error('RealExternalProcessor requires endpoint');
    }

    const prompt = {
      source: request?.source ?? 'unknown',
      text: request?.text ?? '',
      allowed_roles: [...ALLOWED_ROLES],
      allowed_actions: [...ALLOWED_ACTIONS],
      output_schema: {
        actions: [
          {
            botId: 'bot_mayor|bot_trouble',
            type: 'move_local|look_at|wait|move_to',
            params: {
              profile: { direction: 'forward|back|left|right|jump', durationMs: 800, label: 'optional' },
              target: 'look_target_id',
              seconds: 1,
              position: { x: 0, y: 64, z: 0, range: 1 },
            },
          },
        ],
      },
    };

    let lastError;
    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const response = await fetch(this.endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ model: this.model, input: prompt }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`processor http error: ${response.status}`);
        }

        const json = await response.json();
        const actions = parseActionsFromResponse(json);
        return actions;
      } catch (error) {
        lastError = error;
        if (attempt < this.maxRetries) {
          await sleep(120 * (attempt + 1));
          continue;
        }
      } finally {
        clearTimeout(timeoutId);
      }
    }

    throw new Error(`processor failed after retries: ${lastError?.message ?? 'unknown'}`);
  }
}

export const __private = {
  normalizeAction,
  parseActionsFromResponse,
};
