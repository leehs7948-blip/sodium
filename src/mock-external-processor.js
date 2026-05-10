import { ActionType, Role } from './constants.js';
import { ExternalProcessor } from './external-processor.js';

export class MockExternalProcessor extends ExternalProcessor {
  async createPlan(request) {
    const text = String(request?.text ?? '').toLowerCase();

    if (text.includes('광장')) {
      return [
        {
          botId: Role.MAYOR,
          type: ActionType.MOVE_LOCAL,
          params: { profile: { direction: 'forward', durationMs: 1200, label: 'to_square_path' } },
        },
        { botId: Role.MAYOR, type: ActionType.LOOK_AT, params: { target: 'main_stage' } },
      ];
    }

    if (text.includes('광산')) {
      return [
        {
          botId: Role.TROUBLE,
          type: ActionType.MOVE_LOCAL,
          params: { profile: { direction: 'right', durationMs: 900, label: 'to_mine_path' } },
        },
        { botId: Role.TROUBLE, type: ActionType.LOOK_AT, params: { target: 'mine_direction' } },
      ];
    }

    // 테스트 단계에서는 어떤 입력이든 최소 동작을 반환한다.
    return [
      { botId: Role.MAYOR, type: ActionType.WAIT, params: { seconds: 1 } },
      { botId: Role.TROUBLE, type: ActionType.WAIT, params: { seconds: 1 } },
    ];
  }
}
