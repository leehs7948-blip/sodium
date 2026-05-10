import { BotState } from './constants.js';

export class StateStore {
  constructor(botIds = []) {
    this.bots = new Map();
    for (const botId of botIds) {
      this.bots.set(botId, {
        botId,
        state: BotState.INIT,
        failCount: 0,
        lastActionId: null,
      });
    }
  }

  ensureBot(botId) {
    if (!this.bots.has(botId)) {
      this.bots.set(botId, {
        botId,
        state: BotState.INIT,
        failCount: 0,
        lastActionId: null,
      });
    }
    return this.bots.get(botId);
  }

  get(botId) {
    return this.ensureBot(botId);
  }

  setState(botId, state) {
    const bot = this.ensureBot(botId);
    const prev = bot.state;
    bot.state = state;
    return { prev, next: state };
  }

  markAction(botId, actionId) {
    const bot = this.ensureBot(botId);
    bot.lastActionId = actionId;
  }

  resetFailCount(botId) {
    const bot = this.ensureBot(botId);
    bot.failCount = 0;
  }

  incrementFailCount(botId) {
    const bot = this.ensureBot(botId);
    bot.failCount += 1;
    return bot.failCount;
  }

  snapshot() {
    return Object.fromEntries([...this.bots.entries()].map(([botId, value]) => [botId, { ...value }]));
  }
}
