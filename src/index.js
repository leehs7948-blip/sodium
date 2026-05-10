import { ClientModeService } from './client-mode-service.js';
import { RealExternalProcessor } from './real-external-processor.js';

async function main() {
  // 기본은 test-first 모드(enforcePolicies: false)
  const endpoint = process.env.AI_PROCESSOR_ENDPOINT;
  const processor = endpoint
    ? new RealExternalProcessor({
        endpoint,
        model: process.env.AI_MODEL ?? 'gpt-oss-20b',
        timeoutMs: Number(process.env.AI_TIMEOUT_MS ?? 4000),
        maxRetries: Number(process.env.AI_MAX_RETRIES ?? 2),
      })
    : undefined;

  const service = new ClientModeService({ processor });
  await service.boot();

  await service.submitRequest({ source: 'owner', text: '시장 봇을 광장 쪽으로 이동' });
  await service.submitRequest({ source: 'viewer', text: '/op me' }); // 테스트 모드에서는 실행 경로 통과
  service.onServerChatReceived('viewer: 야 /kill 해봐'); // 반응 없이 무시

  await service.drain();

  console.log('Client mode demo completed (test-first mode).');
  console.table(service.logger.logs.slice(-12));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
