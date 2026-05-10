import { ActionType, BotState } from '../constants.js';

export class LocalClientRuntime {
  constructor(botId, stateStore, logger, inputAdapter) {
    this.botId = botId;
    this.stateStore = stateStore;
    this.logger = logger;
    this.inputAdapter = inputAdapter;
    this.connected = false;
  }

  async connect() {
    this.stateStore.setState(this.botId, BotState.CONNECTING);
    await this.inputAdapter.connect();
    this.connected = true;
    this.stateStore.setState(this.botId, BotState.IDLE);
    this.logger.log({ botId: this.botId, event: 'connected' });
  }

  async execute(action) {
    if (this.stateStore.get(this.botId).state === BotState.STOPPED) {
      throw new Error(`Bot ${this.botId} is stopped`);
    }

    if (!this.connected) {
      throw new Error(`Bot ${this.botId} is not connected`);
    }

    this.stateStore.setState(this.botId, BotState.EXECUTING);
    this.stateStore.markAction(this.botId, action.actionId);

    if (action.type === ActionType.MOVE_LOCAL) {
      await this.inputAdapter.moveLocal(action.params.profile);
    } else if (action.type === ActionType.LOOK_AT) {
      await this.inputAdapter.lookAt(action.params.target);
    } else if (action.type === ActionType.WAIT) {
      await this.inputAdapter.wait(action.params.seconds);
    } else if (action.type === ActionType.MOVE_TO) {
      await this.inputAdapter.moveTo(action.params.position);
    } else {
      throw new Error(`Unsupported action type: ${action.type}`);
    }

    this.stateStore.setState(this.botId, BotState.IDLE);
    this.stateStore.resetFailCount(this.botId);
  }

  async recover(error) {
    this.connected = false;
    this.stateStore.setState(this.botId, BotState.RECOVERING);
    const count = this.stateStore.incrementFailCount(this.botId);
    this.logger.log({ botId: this.botId, event: 'recover', failCount: count, reason: error.message });

    if (count >= 3) {
      this.stateStore.setState(this.botId, BotState.STOPPED);
      this.logger.log({ botId: this.botId, event: 'stopped' });
      return;
    }

    await this.connect();
  }
}
