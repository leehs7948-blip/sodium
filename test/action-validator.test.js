import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAction } from '../src/action-validator.js';
import { ensureNoServerOutputAction } from '../src/forbidden-actions.js';

test('validateAction accepts local-only action', () => {
  assert.doesNotThrow(() =>
    validateAction({
      botId: 'bot_mayor',
      type: 'move_local',
      params: { profile: { direction: 'forward', durationMs: 600, label: 'to_square_path' } },
    }),
  );
});

test('validateAction accepts advanced control action', () => {
  assert.doesNotThrow(() =>
    validateAction({
      botId: 'bot_mayor',
      type: 'control_state',
      params: { control: 'sprint', state: true },
    }),
  );
});

test('forbidden action guard rejects server output actions', () => {
  assert.throws(() => ensureNoServerOutputAction({ type: 'say' }), /Forbidden action type/);
});
