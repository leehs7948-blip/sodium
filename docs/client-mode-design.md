# Client Mode Design (v0.2)

## 목표
- 서버 플러그인/모드 없이 바닐라 Paper 1.21.4에 두 봇 접속.
- 봇 조작은 mineflayer 기반 로컬 입력으로만 수행.
- 요청은 ExternalProcessor를 반드시 경유.
- 운영자는 웹 대시보드에서 두 봇을 동시에 조작.

## 구성
1. `ClientModeService`
   - 요청 수신, 플랜 생성, 큐 적재, 런타임 실행.
2. `MineflayerInputAdapter`
   - 실제 봇 접속 및 `move_local`, `look_at`, `wait` 수행.
3. `DashboardServer`
   - `/api/control`로 요청 전달, `/api/state`로 상태 조회.
   - 웹 UI에서 `둘 다/시장만/사건만` 버튼 제공.
4. `ExternalProcessor`
   - Mock 또는 Real(HTTP API) 구현체.

## 실행 흐름
1. 대시보드에서 텍스트 요청 제출 + targets 선택.
2. `submitRequest({ source, text, targets })` 호출.
3. ExternalProcessor가 액션 플랜 반환.
4. Service가 타겟 봇만 필터링 후 큐 적재.
5. 런타임이 mineflayer 어댑터로 순차 실행.
6. 상태/로그가 대시보드로 푸시됨.

## API
- `GET /api/state`
- `POST /api/control`
  - body: `{ text: string, source?: 'owner'|'viewer', targets?: string[] }`

## 비고
- 서버 채팅 입력은 `chat_ignored`로 처리(반응 없음).
- 정책은 `enforcePolicies`로 추후 강화 가능.
