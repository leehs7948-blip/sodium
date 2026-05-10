import { LocalInputAdapter } from './local-input-adapter.js';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export class MockInputAdapter extends LocalInputAdapter {
  constructor(botId, logger) { super(); this.botId = botId; this.logger = logger; }
  async connect() { await sleep(20); this.logger.log({ botId: this.botId, adapter: 'mock_input', event: 'adapter_connected' }); }
  async moveLocal(profile) { this.logger.log({ botId: this.botId, adapter: 'mock_input', action: 'move_local', profile }); }
  async moveTo(position) { this.logger.log({ botId: this.botId, adapter: 'mock_input', action: 'move_to', position }); }
  async controlState(control) { this.logger.log({ botId: this.botId, adapter: 'mock_input', action: 'control_state', control }); }
  async hotbarSelect(slot) { this.logger.log({ botId: this.botId, adapter: 'mock_input', action: 'hotbar_select', slot }); }
  async useItem(params) { this.logger.log({ botId: this.botId, adapter: 'mock_input', action: 'use_item', params }); }
  async digBlock(params) { this.logger.log({ botId: this.botId, adapter: 'mock_input', action: 'dig_block', params }); }
  async lookAt(target) { this.logger.log({ botId: this.botId, adapter: 'mock_input', action: 'look_at', target }); }
  async wait(seconds) { await sleep(seconds * 10); this.logger.log({ botId: this.botId, adapter: 'mock_input', action: 'wait', seconds }); }
}
