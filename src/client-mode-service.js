import { BotState, Role } from './constants.js';
import { ActionQueue } from './action-queue.js';
import { validateAction } from './action-validator.js';
import { ensureNoServerOutputAction } from './forbidden-actions.js';
import { Logger } from './logger.js';
import { MockInputAdapter } from './adapters/mock-input-adapter.js';
import { MockExternalProcessor } from './mock-external-processor.js';
import { classifyRequest } from './request-policy.js';
import { LocalClientRuntime } from './runtime/local-client-runtime.js';
import { StateStore } from './state-store.js';
import { Director } from './director.js';

const BOT_IDS = [Role.MAYOR, Role.TROUBLE];

export class ClientModeService {
  constructor({
    processor = new MockExternalProcessor(),
    logger = new Logger(),
    inputAdapterFactory = (botId) => new MockInputAdapter(botId, logger),
    enforcePolicies = true,
  } = {}) {
    this.processor = processor;
    this.logger = logger;
    this.enforcePolicies = enforcePolicies;
    this.stateStore = new StateStore(BOT_IDS);
    this.actionQueue = new ActionQueue();
    this.director = new Director();
    this.lastAiDebug = null;
    this.runtimes = new Map(
      BOT_IDS.map((id) => [id, new LocalClientRuntime(id, this.stateStore, this.logger, inputAdapterFactory(id))]),
    );
  }

  async boot() {
    await Promise.all(
      [...this.runtimes.values()].map(async (runtime) => {
        try {
          await runtime.connect();
        } catch (error) {
          this.stateStore.setState(runtime.botId, BotState.STOPPED);
          this.logger.log({ event: 'boot_connect_failed', botId: runtime.botId, reason: error.message });
        }
      }),
    );
  }

  enqueueActions(actions, source) {
    for (const action of actions) {
      if (this.enforcePolicies) {
        ensureNoServerOutputAction(action);
        validateAction(action);
      }
      this.actionQueue.enqueue(action);
      this.logger.log({ event: 'action_enqueued', source, actionId: action.actionId, botId: action.botId, type: action.type });
    }
    return actions.length;
  }

  async submitRequest({ source, text, targets = BOT_IDS }) {
    if (this.enforcePolicies) {
      const policy = classifyRequest(text);
      if (!policy.allowed) {
        this.logger.log({ event: 'request_ignored', source, reason: policy.reason, text });
        return 0;
      }
    }

    const prompt = { source, text, targets };
    const plan = await this.processor.createPlan(prompt);
    this.lastAiDebug = { prompt, plan, timestamp: new Date().toISOString() };

    const timestamp = Date.now();
    const targetSet = new Set(targets);
    const actions = plan
      .filter((item) => targetSet.has(item.botId))
      .map((item, i) => ({
        actionId: `${source}-${timestamp}-${i + 1}`,
        botId: item.botId,
        type: item.type,
        params: item.params,
        deadlineMs: 10_000,
        retryPolicy: { maxAttempts: 2, backoffMs: 300 },
      }));

    return this.enqueueActions(actions, source);
  }

  enqueueManualAction(action, source = 'manual') {
    const wrapped = {
      actionId: `${source}-${Date.now()}`,
      deadlineMs: 10_000,
      retryPolicy: { maxAttempts: 1, backoffMs: 100 },
      ...action,
    };
    return this.enqueueActions([wrapped], source);
  }

  enqueueDirectorPlaybook(eventName) {
    const actions = this.director.actionsFor(eventName);
    return this.enqueueActions(actions, 'director_playbook');
  }

  emergencyStop() {
    this.actionQueue = new ActionQueue();
    for (const botId of BOT_IDS) {
      this.stateStore.setState(botId, BotState.STOPPED);
    }
    this.logger.log({ event: 'emergency_stop' });
  }

  onServerChatReceived(_chatLine) {
    this.logger.log({ event: 'chat_ignored' });
  }

  async tick() {
    for (const botId of BOT_IDS) {
      const action = this.actionQueue.next(botId);
      if (!action) continue;
      const runtime = this.runtimes.get(botId);
      try {
        await runtime.execute(action);
        this.logger.log({ event: 'action_done', actionId: action.actionId, botId });
      } catch (error) {
        this.logger.log({ event: 'action_failed', actionId: action.actionId, botId, reason: error.message });
        await runtime.recover(error);
      }
    }
  }

  async drain(maxTicks = 100) {
    for (let i = 0; i < maxTicks; i += 1) {
      await this.tick();
      if (BOT_IDS.every((botId) => this.actionQueue.size(botId) === 0)) break;
    }
  }

  getSnapshot() {
    return {
      state: this.stateStore.snapshot(),
      queue: { bot_mayor: this.actionQueue.size(Role.MAYOR), bot_trouble: this.actionQueue.size(Role.TROUBLE) },
      aiDebug: this.lastAiDebug,
      logs: this.logger.logs.slice(-200),
    };
  }
}
