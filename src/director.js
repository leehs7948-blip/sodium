import { ActionType, Role } from './constants.js';

const PLAYBOOKS = {
  festival_start: [
    { botId: Role.MAYOR, type: ActionType.MOVE_LOCAL, params: { profile: 'to_square_path' } },
    { botId: Role.MAYOR, type: ActionType.LOOK_AT, params: { target: 'main_stage' } },
    { botId: Role.TROUBLE, type: ActionType.MOVE_LOCAL, params: { profile: 'to_stage_side_path' } },
    { botId: Role.TROUBLE, type: ActionType.WAIT, params: { seconds: 4 } },
    { botId: Role.TROUBLE, type: ActionType.LOOK_AT, params: { target: 'crowd_zone' } },
  ],
  emergency_meeting: [
    { botId: Role.MAYOR, type: ActionType.MOVE_LOCAL, params: { profile: 'to_hall_path' } },
    { botId: Role.MAYOR, type: ActionType.LOOK_AT, params: { target: 'hall_center' } },
    { botId: Role.TROUBLE, type: ActionType.MOVE_LOCAL, params: { profile: 'to_hall_gate_path' } },
    { botId: Role.TROUBLE, type: ActionType.LOOK_AT, params: { target: 'hall_entry' } },
  ],
  resource_shortage: [
    { botId: Role.MAYOR, type: ActionType.MOVE_LOCAL, params: { profile: 'to_storage_path' } },
    { botId: Role.TROUBLE, type: ActionType.LOOK_AT, params: { target: 'mine_direction' } },
  ],
};

let sequence = 0;

export class Director {
  actionsFor(eventName) {
    const template = PLAYBOOKS[eventName];
    if (!template) {
      throw new Error(`Unknown event: ${eventName}`);
    }

    return template.map((item) => ({
      actionId: `${eventName}-${++sequence}`,
      botId: item.botId,
      type: item.type,
      params: item.params,
      deadlineMs: 10_000,
      retryPolicy: {
        maxAttempts: 2,
        backoffMs: 300,
      },
    }));
  }
}
