import { ClientModeService } from './client-mode-service.js';
import { RealExternalProcessor } from './real-external-processor.js';
import { MineflayerInputAdapter } from './adapters/mineflayer-input-adapter.js';
import { DashboardServer } from './dashboard-server.js';

async function main() {
  const endpoint = process.env.AI_PROCESSOR_ENDPOINT;
  const processor = endpoint
    ? new RealExternalProcessor({
        endpoint,
        model: process.env.AI_MODEL ?? 'gpt-oss-20b',
        timeoutMs: Number(process.env.AI_TIMEOUT_MS ?? 4000),
        maxRetries: Number(process.env.AI_MAX_RETRIES ?? 2),
      })
    : undefined;

  const serverHost = process.env.MC_HOST ?? '127.0.0.1';
  const serverPort = Number(process.env.MC_PORT ?? 25565);
  const inputAdapterFactory = (botId) =>
    new MineflayerInputAdapter(botId, console, {
      host: serverHost,
      port: serverPort,
      username: process.env[`${botId.toUpperCase()}_USERNAME`] ?? botId,
      auth: process.env.MC_AUTH ?? 'offline',
      version: process.env.MC_VERSION ?? '1.21.4',
    });

  const service = new ClientModeService({ processor, inputAdapterFactory, enforcePolicies: false });
  await service.boot();

  const dashboard = new DashboardServer(service, { port: Number(process.env.DASHBOARD_PORT ?? 3100) });
  await dashboard.start();
  console.log(`Dashboard started: http://127.0.0.1:${process.env.DASHBOARD_PORT ?? 3100}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
