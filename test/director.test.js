import test from 'node:test';
import assert from 'node:assert/strict';
import { Director } from '../src/director.js';

test('director creates local-control-only festival actions', () => {
  const director = new Director();
  const actions = director.actionsFor('festival_start');

  assert.equal(actions.length, 5);
  assert.equal(actions[0].type, 'move_local');
  assert.equal(typeof actions[0].params.profile, 'object');
  assert.equal(actions[0].params.profile.direction, 'forward');
  assert.equal(actions[1].type, 'look_at');
  assert.equal(actions.some((a) => a.type === 'say'), false);
});

test('director throws for unknown events', () => {
  const director = new Director();
  assert.throws(() => director.actionsFor('unknown_event'), /Unknown event/);
});
