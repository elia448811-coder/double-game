import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('siteGate', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_AUTH_API_URL', '');
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('gate disabled when VITE_AUTH_API_URL is empty', async () => {
    const { getAuthApiUrl, isSiteGateEnabled } = await import('./siteGate');
    expect(getAuthApiUrl()).toBe('');
    expect(isSiteGateEnabled()).toBe(false);
  });

  it('allows entry when gate disabled', async () => {
    const { verifySitePassword } = await import('./siteGate');
    expect(await verifySitePassword('anything')).toBe(true);
  });

  it('rejects empty password when gate enabled', async () => {
    vi.stubEnv('VITE_AUTH_API_URL', 'https://auth.example.com');
    vi.resetModules();
    const { verifySitePassword } = await import('./siteGate');
    expect(await verifySitePassword('')).toBe(false);
    expect(await verifySitePassword('   ')).toBe(false);
  });

  it('returns true when API responds ok', async () => {
    vi.stubEnv('VITE_AUTH_API_URL', 'https://auth.example.com');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ok: true }),
      }),
    );
    vi.resetModules();
    const { verifySitePassword } = await import('./siteGate');

    const ok = await verifySitePassword('secret');
    expect(ok).toBe(true);
    expect(fetch).toHaveBeenCalledWith('https://auth.example.com/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'secret' }),
    });
  });

  it('returns false on wrong password or HTTP error', async () => {
    vi.stubEnv('VITE_AUTH_API_URL', 'https://auth.example.com');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ ok: false }),
      }),
    );
    vi.resetModules();
    const { verifySitePassword } = await import('./siteGate');
    expect(await verifySitePassword('wrong')).toBe(false);
  });

  it('returns false when fetch fails', async () => {
    vi.stubEnv('VITE_AUTH_API_URL', 'https://auth.example.com');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));
    vi.resetModules();
    const { verifySitePassword } = await import('./siteGate');
    expect(await verifySitePassword('secret')).toBe(false);
  });
});
