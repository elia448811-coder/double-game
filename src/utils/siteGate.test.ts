import { describe, expect, it } from 'vitest';
import { isSiteGateEnabled, verifySitePassword } from './siteGate';

describe('siteGate', () => {
  it('gate disabled when PASS_W is empty at build', () => {
    expect(isSiteGateEnabled()).toBe(false);
    expect(verifySitePassword('anything')).toBe(true);
  });
});
