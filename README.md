# Sodium Client Mode

Paper 1.21.4 기준으로 mineflayer 두 봇(bot_mayor, bot_trouble)을 제어하는 대시보드 앱입니다.

## 실행 모드
- `npm start`: 대시보드 백엔드만 실행 (`http://127.0.0.1:3100`)
- `npm run start:electron`: **Electron 앱** 실행
  - 기존 Sodium 서버 프로세스 실행
  - 대시보드 백엔드 실행
  - Electron 창에서 대시보드 표시

## config.json 주요 항목
- `minecraft`: 봇 접속 대상 서버
- `dashboard.port`: 대시보드 포트
- `sodiumServer`: Electron에서 실행할 서버 명령
- `dashboardApp`: Electron에서 실행할 백엔드 명령
- `lookTargets`: `look_at` 타겟 매핑

## 개발 체크
- `npm test`
- `npm run doctor`
