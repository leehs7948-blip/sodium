import test from 'node:test';
import assert from 'node:assert/strict';
import { RealExternalProcessor, __private } from '../src/real-external-processor.js';

test('normalizeAction drops invalid actions', () => {
  const { normalizeAction } = __private;
  assert.equal(normalizeAction({ botId: 'bot_mayor', type: 'control_state', params: { control: 'sprint', state: true } })?.type, 'control_state');
  assert.equal(normalizeAction({ botId: 'unknown', type: 'move_local', params: { profile: {} } }), null);
  assert.equal(normalizeAction({ botId: 'bot_mayor', type: 'hotbar_select', params: { slot: 12 } }), null);
  assert.equal(normalizeAction({ botId: 'bot_mayor', type: 'say', params: { text: 'x' } }), null);
});

test('createPlan parses actions from successful response', async () => {
  const originalFetch = global.fetch;
  let body;

  global.fetch = async (_url, init) => {
    body = JSON.parse(init.body);
    return {
      ok: true,
      async json() {
        return {
          actions: [
            { botId: 'bot_mayor', type: 'control_state', params: { control: 'forward', state: true } },
            { botId: 'bot_trouble', type: 'dig_block', params: { maxMs: 9000 } },
          ],
        };
      },
    };
  };

  try {
    const processor = new RealExternalProcessor({ endpoint: 'http://local.test/plan' });
    const actions = await processor.createPlan({ source: 'owner', text: '광질 시작' });
    assert.equal(actions.length, 2);
    assert.equal(actions[0].type, 'control_state');
    assert.equal(typeof body.input.output_schema.actions[0].params.profile, 'object');
  } finally {
    global.fetch = originalFetch;
  }
});

test('createPlan retries then fails when endpoint keeps failing', async () => {
  const originalFetch = global.fetch;
  let callCount = 0;
  global.fetch = async () => {
    callCount += 1;
    return { ok: false, status: 500, async json() { return {}; } };
  };

  try {
    const processor = new RealExternalProcessor({ endpoint: 'http://local.test/plan', maxRetries: 1, timeoutMs: 50 });
    await assert.rejects(() => processor.createPlan({ source: 'owner', text: '광장' }), /processor failed after retries/);
    assert.equal(callCount, 2);
  } finally {
    global.fetch = originalFetch;
  }
});
