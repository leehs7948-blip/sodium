# Client Mode 설계 초안 (Paper 1.21.4) — test-first mode

## 목표
- 먼저 동작 여부를 검증하고, 이후 제한을 점진적으로 켠다.
- 입력 경로는 외부 프로세서를 유지한다.

## 모드
1) **Test-first 모드 (기본값)**
- `enforcePolicies: false`
- 요청 차단 없이 실행
- 빠른 기능 검증용

2) **Policy 모드 (옵션)**
- `enforcePolicies: true`
- RequestPolicy, ForbiddenGuard, ActionValidator 적용
- 운영 안정화용

## 입력 파이프라인
```text
request -> ExternalProcessor.createPlan()
        -> (optional: policy/guard/validator)
        -> ActionQueue
        -> LocalClientRuntime
        -> InputAdapter(local client input)
```

## RealExternalProcessor 연동 규격
요청(POST JSON):
```json
{ "model": "gpt-oss-20b", "input": { "source": "owner|viewer", "text": "..." } }
```

응답(JSON):
```json
{
  "actions": [
    { "botId": "bot_mayor", "type": "move_local", "params": { "profile": "to_square_path" } }
  ]
}
```

- 허용 botId: `bot_mayor`, `bot_trouble`
- 허용 type: `move_local`, `look_at`, `wait`
- 타임아웃/재시도: 환경변수로 제어

## 구현 포인트
- `submitRequest()`가 단일 진입점
- 기본값은 정책 비활성화
- 정책을 켜면 악성 명령 차단 및 금지 액션 거부

## 다음 단계
- 테스트 단계 종료 후 운영환경에서 정책 모드 기본화
- 시청자 요청량 제한/쿨다운 추가
- 실제 입력 어댑터 및 실오프로드 프로세서로 교체
