import { describe, expect, it } from 'vitest';
import { isSiteGateEnabled, readGateSession, verifySitePassword } from './siteGate';

describe('siteGate', () => {
  it('gate disabled when PASS_ is empty at build', () => {
    expect(isSiteGateEnabled()).toBe(false);
    expect(verifySitePassword('anything')).toBe(true);
  });

  it('readGateSession returns false when unset', () => {
    expect(readGateSession()).toBe(false);
  });
});
