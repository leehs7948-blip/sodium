import mineflayer from 'mineflayer';
import { LocalInputAdapter } from './local-input-adapter.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const DIRECTIONS = ['forward', 'back', 'left', 'right', 'jump'];

function normalizeMoveProfile(profile) {
  const raw = profile && typeof profile === 'object' ? profile : {};
  const direction = DIRECTIONS.includes(raw.direction) ? raw.direction : 'forward';
  const durationMs = Number.isFinite(Number(raw.durationMs)) ? Number(raw.durationMs) : 800;
  return { direction, durationMs: Math.max(100, Math.min(10_000, durationMs)), label: raw.label ?? null };
}

export class MineflayerInputAdapter extends LocalInputAdapter {
  constructor(botId, logger, config) {
    super();
    this.botId = botId;
    this.logger = logger;
    this.config = config;
    this.bot = null;
    this.pathfinder = null;
    this.Movements = null;
    this.goals = null;
  }

  async connect() {
    this.bot = mineflayer.createBot({
      host: this.config.host,
      port: this.config.port,
      username: this.config.username,
      auth: this.config.auth ?? 'offline',
      version: this.config.version ?? '1.21.4',
    });

    await new Promise((resolve, reject) => {
      const onSpawn = () => { cleanup(); resolve(); };
      const onError = (error) => { cleanup(); reject(error); };
      const cleanup = () => {
        this.bot.removeListener('spawn', onSpawn);
        this.bot.removeListener('error', onError);
      };
      this.bot.once('spawn', onSpawn);
      this.bot.once('error', onError);
    });

    await this.setupPathfinder();
    this.logger.log({ botId: this.botId, adapter: 'mineflayer', event: 'adapter_connected' });
  }

  async setupPathfinder() {
    try {
      const mod = await import('mineflayer-pathfinder');
      const plugin = mod.pathfinder ?? mod.default?.pathfinder;
      this.Movements = mod.Movements ?? mod.default?.Movements;
      this.goals = mod.goals ?? mod.default?.goals;
      if (plugin) {
        this.bot.loadPlugin(plugin);
        this.pathfinder = this.bot.pathfinder;
      }
    } catch (error) {
      this.logger.log({ botId: this.botId, event: 'pathfinder_unavailable', reason: error.message });
    }
  }

  async moveLocal(profile) {
    if (!this.bot?.entity) return;
    const { direction, durationMs, label } = normalizeMoveProfile(profile);
    this.bot.setControlState(direction, true);
    await sleep(durationMs);
    this.bot.setControlState(direction, false);
    this.logger.log({ botId: this.botId, adapter: 'mineflayer', action: 'move_local', direction, durationMs, label });
  }

  async moveTo(position) {
    if (!this.bot?.entity || !position) return;
    if (!this.pathfinder || !this.Movements || !this.goals?.GoalNear) {
      this.logger.log({ botId: this.botId, adapter: 'mineflayer', action: 'move_to_skipped', reason: 'pathfinder_unavailable' });
      return;
    }

    const movements = new this.Movements(this.bot);
    this.pathfinder.setMovements(movements);
    const x = Number(position.x);
    const y = Number(position.y);
    const z = Number(position.z);
    const range = Number(position.range ?? 1);
    await this.pathfinder.goto(new this.goals.GoalNear(x, y, z, range));
    this.logger.log({ botId: this.botId, adapter: 'mineflayer', action: 'move_to', x, y, z, range });
  }

  async lookAt(target) {
    if (!this.bot?.entity) return;
    const mapping = this.config.lookTargets?.[target];
    const yaw = Number(mapping?.yaw ?? target?.yaw ?? 0);
    const pitch = Number(mapping?.pitch ?? target?.pitch ?? 0);
    await this.bot.look(yaw, pitch, true);
    this.logger.log({ botId: this.botId, adapter: 'mineflayer', action: 'look_at', target, yaw, pitch });
  }

  async wait(seconds) {
    await sleep(Number(seconds ?? 1) * 1000);
    this.logger.log({ botId: this.botId, adapter: 'mineflayer', action: 'wait', seconds });
  }
}
