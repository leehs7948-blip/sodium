import { ActionType, Role } from './constants.js';

const ALLOWED_BOTS = new Set([Role.MAYOR, Role.TROUBLE]);
const ALLOWED_TYPES = new Set(Object.values(ActionType));

export function validateAction(action) {
  if (!action || typeof action !== 'object') {
    throw new Error('Invalid action: action must be an object');
  }
  if (!ALLOWED_BOTS.has(action.botId)) {
    throw new Error(`Invalid action.botId: ${action.botId}`);
  }
  if (!ALLOWED_TYPES.has(action.type)) {
    throw new Error(`Invalid action.type: ${action.type}`);
  }

  if (action.type === ActionType.MOVE_LOCAL) {
    const profile = action.params?.profile;
    if (!profile || typeof profile !== 'object') {
      throw new Error('Invalid move_local params.profile');
    }
    const durationMs = Number(profile.durationMs ?? 800);
    if (!Number.isFinite(durationMs) || durationMs < 100 || durationMs > 10_000) {
      throw new Error('Invalid move_local params.profile.durationMs');
    }
    if (profile.direction != null && !['forward', 'back', 'left', 'right', 'jump'].includes(profile.direction)) {
      throw new Error('Invalid move_local params.profile.direction');
    }
  }

  if (action.type === ActionType.LOOK_AT) {
    if (!action.params?.target) {
      throw new Error('Invalid look_at params.target');
    }
  }



  if (action.type === ActionType.MOVE_TO) {
    const pos = action.params?.position;
    if (!pos || !Number.isFinite(Number(pos.x)) || !Number.isFinite(Number(pos.y)) || !Number.isFinite(Number(pos.z))) {
      throw new Error('Invalid move_to params.position');
    }
  }

  if (action.type === ActionType.WAIT) {
    const sec = action.params?.seconds;
    if (typeof sec !== 'number' || sec < 0 || sec > 60) {
      throw new Error('Invalid wait params.seconds');
    }
  }
}
