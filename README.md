# Sodium Client Mode (v0.1 scaffold)

Paper 1.21.4 환경에서 **2개 AI 클라이언트(bot_mayor, bot_trouble)**를 이벤트 기반으로 조작하기 위한 최소 구현 스캐폴드입니다.

## 현재 운영 모드 (테스트 우선)
- 기본값은 **제한 비활성화 모드**입니다.
- 즉, 요청을 먼저 실행해 동작 검증을 하고 나중에 제한을 켤 수 있습니다.
- 정책/가드가 필요한 경우 `ClientModeService({ enforcePolicies: true })`로 활성화합니다.

## AI 연동
- 기본은 `MockExternalProcessor`를 사용합니다.
- `AI_PROCESSOR_ENDPOINT` 환경변수가 있으면 `RealExternalProcessor`를 사용합니다.
- `RealExternalProcessor`는 외부 API에 `{ model, input }` JSON을 POST하고, 응답의 `actions` 배열을 실행 플랜으로 사용합니다.

환경변수:
- `AI_PROCESSOR_ENDPOINT` (예: `http://127.0.0.1:8000/plan`)
- `AI_MODEL` (기본: `gpt-oss-20b`)
- `AI_TIMEOUT_MS` (기본: `4000`)
- `AI_MAX_RETRIES` (기본: `2`)

## 실행
- `npm test`
- `npm start`

## 현재 구현
- ExternalProcessor(Mock/Real): 텍스트 -> 로컬 조작 액션 플랜
- LocalClientRuntime + InputAdapter: 런타임/입력 어댑터 분리
- ClientModeService: `submitRequest()` 단일 입력 경로
- 선택 기능: RequestPolicy + ForbiddenGuard + ActionValidator (정책 모드에서만 적용)

## 다음 단계
- 정책 모드(`enforcePolicies: true`)를 운영환경에서 기본값으로 전환
- MockInputAdapter를 실제 클라이언트 제어 어댑터로 교체
- RealExternalProcessor를 실오프로드 API 규격에 맞춰 고정
