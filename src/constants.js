export const BotState = Object.freeze({
  INIT: 'INIT',
  CONNECTING: 'CONNECTING',
  IDLE: 'IDLE',
  EXECUTING: 'EXECUTING',
  RECOVERING: 'RECOVERING',
  STOPPED: 'STOPPED',
});

export const ActionType = Object.freeze({
  MOVE_LOCAL: 'move_local',
  LOOK_AT: 'look_at',
  WAIT: 'wait',
});

export const Role = Object.freeze({
  MAYOR: 'bot_mayor',
  TROUBLE: 'bot_trouble',
});
