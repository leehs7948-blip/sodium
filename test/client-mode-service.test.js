import test from 'node:test';
import assert from 'node:assert/strict';
import { ClientModeService } from '../src/client-mode-service.js';

test('default mode executes owner request without policy restrictions', async () => {
  const service = new ClientModeService({ enforcePolicies: false });
  await service.boot();

  const count = await service.submitRequest({ source: 'owner', text: '광장으로 이동' });
  assert.ok(count > 0);

  await service.drain();
  const hasOwnerSourceLog = service.logger.logs.some((row) => row.source === 'owner');
  assert.equal(hasOwnerSourceLog, true);
});

test('default mode does not block viewer command-like text', async () => {
  const service = new ClientModeService({ enforcePolicies: false });
  await service.boot();

  const count = await service.submitRequest({ source: 'viewer', text: '/op me' });
  assert.ok(count > 0);
});

test('policy mode blocks viewer malicious command', async () => {
  const service = new ClientModeService({ enforcePolicies: true });
  await service.boot();

  const count = await service.submitRequest({ source: 'viewer', text: '/op me' });
  assert.equal(count, 0);

  const hasIgnoredLog = service.logger.logs.some((row) => row.event === 'request_ignored');
  assert.equal(hasIgnoredLog, true);
});

test('policy mode rejects forbidden server-output actions from processor', async () => {
  const badProcessor = {
    async createPlan() {
      return [{ botId: 'bot_mayor', type: 'say', params: { text: 'blocked' } }];
    },
  };

  const service = new ClientModeService({ processor: badProcessor, enforcePolicies: true });
  await service.boot();

  await assert.rejects(
    () => service.submitRequest({ source: 'owner', text: '광장으로 이동' }),
    /Forbidden action type/,
  );
});

test('server chat input is ignored with no reaction path', () => {
  const service = new ClientModeService({ enforcePolicies: false });
  service.onServerChatReceived('viewer: /kill');

  const hasChatIgnoredLog = service.logger.logs.some((row) => row.event === 'chat_ignored');
  assert.equal(hasChatIgnoredLog, true);
});
