# Sodium Desktop v1 (아기토끼용 안내서)

이 앱은 **Fabric 모드가 아닙니다**.  
마인크래프트 서버 안에 모드를 넣는 방식이 아니라, **서버 밖에서 봇을 조작하는 데스크톱 앱**입니다.

## 1) 준비
### Paper 서버 준비
1. `server/` 폴더 생성
2. `server.jar` 넣기 (Paper 1.21.4)
3. `server.properties`에서 테스트용으로 `online-mode=false` 권장

> 운영 서버에 바로 쓰기 전에 반드시 테스트 서버에서 확인하세요.

## 2) 설치/실행
```bash
npm install
npm run doctor
npm run start:electron
```

브라우저 방식도 가능:
```bash
npm start
```
그리고 `http://127.0.0.1:3100` 접속

## 3) config.json 핵심 설정
- `minecraft.host`, `minecraft.port`, `minecraft.version`, `minecraft.auth`
- `bots.bot_mayor.username`, `bots.bot_trouble.username`
- `processor.endpoint`, `processor.model`
- `sodiumServer.enabled`
  - 기본값 `false` (안전)
  - `true`면 Electron이 Paper 서버 자동 실행 시도

## 4) 로컬 LLM 연결
- `processor.endpoint`에 로컬 LLM API 주소 입력
- 앱의 **LLM 연결 테스트** 버튼으로 확인
- 성공 시 `Local LLM connected`

## 5) 앱에서 가능한 것
- 봇 재접속(개별/전체)
- 수동 조작
- AI 명령
- Playbook
- 긴급정지 (EMERGENCY STOP)
- 상태/로그 확인
- 설정 저장

## 6) 자주 나는 오류
- `electron: not found`
  - `npm install`이 안 되었거나 electron 설치 실패
- `CONNECT tunnel failed 403`
  - 네트워크/프록시 문제로 원격 접근 실패
- 봇 접속 실패
  - `minecraft.host/port/auth` 확인
  - 서버가 켜져 있는지 확인
- LLM 테스트 실패
  - `processor.endpoint` 오타/서버 미기동 확인
