import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyRequest } from '../src/request-policy.js';

test('policy allows normal request', () => {
  const result = classifyRequest('광장으로 이동');
  assert.equal(result.allowed, true);
});

test('policy blocks command-like request', () => {
  const result = classifyRequest('/op me');
  assert.equal(result.allowed, false);
  assert.equal(result.reason, 'blocked_pattern');
});
