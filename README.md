# Sodium Client Mode

Paper 1.21.4 기준으로 **mineflayer 두 봇(bot_mayor, bot_trouble)**을 실제 접속시켜 로컬에서 조작하고, 웹 대시보드에서 동시에 제어하는 프로젝트입니다.

## 핵심 동작
- 입력은 `submitRequest()` 단일 경로로 처리.
- 요청은 항상 ExternalProcessor를 거쳐 액션 플랜 생성.
- 서버 채팅 입력은 반응하지 않음(`chat_ignored`).
- 대시보드에서 두 봇 동시/개별 제어 가능.

## 실행 전 환경변수
- `MC_HOST` (default: `127.0.0.1`)
- `MC_PORT` (default: `25565`)
- `MC_VERSION` (default: `1.21.4`)
- `MC_AUTH` (default: `offline`)
- `BOT_MAYOR_USERNAME` (default: `bot_mayor`)
- `BOT_TROUBLE_USERNAME` (default: `bot_trouble`)
- `DASHBOARD_PORT` (default: `3100`)

AI 프로세서(선택):
- `AI_PROCESSOR_ENDPOINT`
- `AI_MODEL` (default: `gpt-oss-20b`)
- `AI_TIMEOUT_MS` (default: `4000`)
- `AI_MAX_RETRIES` (default: `2`)

## 실행
```bash
npm install
npm start
```

브라우저에서 `http://127.0.0.1:3100` 접속 후 텍스트를 넣고
- **두 봇 실행**: mayor/trouble 동시에 액션 생성/실행
- **시장만 / 사건만**: 타겟팅 제어

## 테스트
```bash
npm test
```
