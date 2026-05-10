import { ActionType, Role } from './constants.js';

const ALLOWED_BOTS = new Set([Role.MAYOR, Role.TROUBLE]);
const ALLOWED_TYPES = new Set(Object.values(ActionType));
const CONTROLS = ['forward', 'back', 'left', 'right', 'jump', 'sprint', 'sneak'];

export function validateAction(action) {
  if (!action || typeof action !== 'object') throw new Error('Invalid action: action must be an object');
  if (!ALLOWED_BOTS.has(action.botId)) throw new Error(`Invalid action.botId: ${action.botId}`);
  if (!ALLOWED_TYPES.has(action.type)) throw new Error(`Invalid action.type: ${action.type}`);

  if (action.type === ActionType.MOVE_LOCAL) {
    const profile = action.params?.profile;
    if (!profile || typeof profile !== 'object') throw new Error('Invalid move_local params.profile');
    const durationMs = Number(profile.durationMs ?? 800);
    if (!Number.isFinite(durationMs) || durationMs < 100 || durationMs > 10_000) throw new Error('Invalid move_local params.profile.durationMs');
    if (profile.direction != null && !['forward', 'back', 'left', 'right', 'jump'].includes(profile.direction)) {
      throw new Error('Invalid move_local params.profile.direction');
    }
  }

  if (action.type === ActionType.LOOK_AT && !action.params?.target) throw new Error('Invalid look_at params.target');

  if (action.type === ActionType.MOVE_TO) {
    const pos = action.params?.position;
    if (!pos || !Number.isFinite(Number(pos.x)) || !Number.isFinite(Number(pos.y)) || !Number.isFinite(Number(pos.z))) {
      throw new Error('Invalid move_to params.position');
    }
  }

  if (action.type === ActionType.CONTROL_STATE) {
    const control = action.params?.control;
    const state = action.params?.state;
    if (!CONTROLS.includes(control)) throw new Error('Invalid control_state params.control');
    if (typeof state !== 'boolean') throw new Error('Invalid control_state params.state');
  }

  if (action.type === ActionType.HOTBAR_SELECT) {
    const slot = Number(action.params?.slot);
    if (!Number.isInteger(slot) || slot < 0 || slot > 8) throw new Error('Invalid hotbar_select params.slot');
  }

  if (action.type === ActionType.USE_ITEM) {
    const durationMs = Number(action.params?.durationMs ?? 200);
    if (!Number.isFinite(durationMs) || durationMs < 50 || durationMs > 60_000) throw new Error('Invalid use_item params.durationMs');
  }

  if (action.type === ActionType.DIG_BLOCK) {
    const maxMs = Number(action.params?.maxMs ?? 8_000);
    if (!Number.isFinite(maxMs) || maxMs < 500 || maxMs > 60_000) throw new Error('Invalid dig_block params.maxMs');
  }

  if (action.type === ActionType.WAIT) {
    const sec = action.params?.seconds;
    if (typeof sec !== 'number' || sec < 0 || sec > 60) throw new Error('Invalid wait params.seconds');
  }
}
