import { describe, expect, it } from 'vitest';
import { getAuthApiUrl, isSiteGateEnabled, verifySitePassword } from './siteGate';

describe('siteGate', () => {
  it('gate disabled when VITE_AUTH_API_URL is empty', () => {
    expect(getAuthApiUrl()).toBe('');
    expect(isSiteGateEnabled()).toBe(false);
  });

  it('allows entry when gate disabled', async () => {
    expect(await verifySitePassword('anything')).toBe(true);
  });
});
