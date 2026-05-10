import fs from 'node:fs';
import { ClientModeService } from './client-mode-service.js';
import { RealExternalProcessor } from './real-external-processor.js';
import { MineflayerInputAdapter } from './adapters/mineflayer-input-adapter.js';
import { DashboardServer } from './dashboard-server.js';
import { Logger } from './logger.js';

function loadConfig() {
  const raw = fs.readFileSync(new URL('../config.json', import.meta.url), 'utf8');
  return JSON.parse(raw);
}

async function main() {
  const config = loadConfig();
  const logger = new Logger();
  const endpoint = process.env.AI_PROCESSOR_ENDPOINT || config.processor.endpoint;
  const processor = endpoint
    ? new RealExternalProcessor({
        endpoint,
        model: process.env.AI_MODEL ?? config.processor.model,
        timeoutMs: Number(process.env.AI_TIMEOUT_MS ?? config.processor.timeoutMs),
        maxRetries: Number(process.env.AI_MAX_RETRIES ?? config.processor.maxRetries),
      })
    : undefined;

  const inputAdapterFactory = (botId) =>
    new MineflayerInputAdapter(botId, logger, {
      host: process.env.MC_HOST ?? config.minecraft.host,
      port: Number(process.env.MC_PORT ?? config.minecraft.port),
      username: process.env[`${botId.toUpperCase()}_USERNAME`] ?? config.bots[botId]?.username ?? botId,
      auth: process.env.MC_AUTH ?? config.minecraft.auth,
      version: process.env.MC_VERSION ?? config.minecraft.version,
      lookTargets: config.lookTargets,
    });

  const service = new ClientModeService({ processor, inputAdapterFactory, logger, enforcePolicies: config.enforcePolicies });
  const dashboard = new DashboardServer(service, { port: Number(process.env.DASHBOARD_PORT ?? config.dashboard.port) });
  await dashboard.start();

  service.boot().catch((error) => {
    logger.log({ event: 'boot_failed_global', reason: error.message });
  });

  console.log(`Dashboard started: http://127.0.0.1:${process.env.DASHBOARD_PORT ?? config.dashboard.port}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
