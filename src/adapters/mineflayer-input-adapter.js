import mineflayer from 'mineflayer';
import { LocalInputAdapter } from './local-input-adapter.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export class MineflayerInputAdapter extends LocalInputAdapter {
  constructor(botId, logger, config) {
    super();
    this.botId = botId;
    this.logger = logger;
    this.config = config;
    this.bot = null;
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
      const onSpawn = () => {
        cleanup();
        resolve();
      };
      const onError = (error) => {
        cleanup();
        reject(error);
      };
      const cleanup = () => {
        this.bot.removeListener('spawn', onSpawn);
        this.bot.removeListener('error', onError);
      };

      this.bot.once('spawn', onSpawn);
      this.bot.once('error', onError);
    });

    this.logger.log({ botId: this.botId, adapter: 'mineflayer', event: 'adapter_connected' });
  }

  async moveLocal(profile) {
    if (!this.bot?.entity) return;

    const durationMs = Number(profile?.durationMs ?? 800);
    const direction = String(profile?.direction ?? 'forward');
    const allowed = ['forward', 'back', 'left', 'right', 'jump'];
    const control = allowed.includes(direction) ? direction : 'forward';

    this.bot.setControlState(control, true);
    await sleep(durationMs);
    this.bot.setControlState(control, false);

    this.logger.log({ botId: this.botId, adapter: 'mineflayer', action: 'move_local', direction, durationMs });
  }

  async lookAt(target) {
    if (!this.bot?.entity) return;

    const yaw = Number(target?.yaw ?? 0);
    const pitch = Number(target?.pitch ?? 0);
    await this.bot.look(yaw, pitch, true);
    this.logger.log({ botId: this.botId, adapter: 'mineflayer', action: 'look_at', yaw, pitch });
  }

  async wait(seconds) {
    await sleep(Number(seconds ?? 1) * 1000);
    this.logger.log({ botId: this.botId, adapter: 'mineflayer', action: 'wait', seconds });
  }
}
