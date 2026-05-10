export class ActionQueue {
  constructor() {
    this.queues = new Map();
  }

  enqueue(action) {
    if (!this.queues.has(action.botId)) {
      this.queues.set(action.botId, []);
    }
    this.queues.get(action.botId).push(action);
  }

  next(botId) {
    const queue = this.queues.get(botId) ?? [];
    return queue.shift() ?? null;
  }

  size(botId) {
    return (this.queues.get(botId) ?? []).length;
  }
}
