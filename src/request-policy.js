const BLOCK_PATTERNS = [
  /\//,
  /op/i,
  /deop/i,
  /ban/i,
  /kick/i,
  /stop/i,
  /exec/i,
  /sudo/i,
  /plugin/i,
];

export function classifyRequest(text) {
  const normalized = String(text ?? '').trim();
  if (!normalized) {
    return { allowed: false, reason: 'empty' };
  }

  if (BLOCK_PATTERNS.some((p) => p.test(normalized))) {
    return { allowed: false, reason: 'blocked_pattern' };
  }

  return { allowed: true, reason: 'allowed' };
}
