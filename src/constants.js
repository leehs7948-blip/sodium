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
  MOVE_TO: 'move_to',
  CONTROL_STATE: 'control_state',
  HOTBAR_SELECT: 'hotbar_select',
  USE_ITEM: 'use_item',
  DIG_BLOCK: 'dig_block',
});

export const Role = Object.freeze({
  MAYOR: 'bot_mayor',
  TROUBLE: 'bot_trouble',
});
