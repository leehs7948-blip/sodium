import test from 'node:test';
import assert from 'node:assert/strict';
import { RealExternalProcessor, __private } from '../src/real-external-processor.js';

test('normalizeAction drops invalid actions', () => {
  const { normalizeAction } = __private;
  assert.equal(
    normalizeAction({
      botId: 'bot_mayor',
      type: 'move_local',
      params: { profile: { direction: 'forward', durationMs: 500 } },
    })?.type,
    'move_local',
  );
  assert.equal(normalizeAction({ botId: 'unknown', type: 'move_local', params: { profile: {} } }), null);
  assert.equal(normalizeAction({ botId: 'bot_mayor', type: 'move_local', params: { profile: 'x' } }), null);
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
            { botId: 'bot_mayor', type: 'move_local', params: { profile: { direction: 'forward', durationMs: 700 } } },
            { botId: 'bot_trouble', type: 'wait', params: { seconds: 1 } },
          ],
        };
      },
    };
  };

  try {
    const processor = new RealExternalProcessor({ endpoint: 'http://local.test/plan' });
    const actions = await processor.createPlan({ source: 'owner', text: '광장' });
    assert.equal(actions.length, 2);
    assert.equal(actions[0].type, 'move_local');
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
    await assert.rejects(
      () => processor.createPlan({ source: 'owner', text: '광장' }),
      /processor failed after retries/,
    );
    assert.equal(callCount, 2);
  } finally {
    global.fetch = originalFetch;
  }
});
