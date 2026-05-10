export const FORBIDDEN_ACTION_NAMES = Object.freeze([
  'say',
  'chat',
  'command',
  'execute_command',
]);

export function ensureNoServerOutputAction(action) {
  if (!action?.type) {
    return;
  }
  if (FORBIDDEN_ACTION_NAMES.includes(action.type)) {
    throw new Error(`Forbidden action type for vanilla stability: ${action.type}`);
  }
}
