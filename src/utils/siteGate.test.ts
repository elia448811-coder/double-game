import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function mockStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => store.set(k, v),
    removeItem: (k: string) => store.delete(k),
    clear: () => store.clear(),
    get length() {
      return store.size;
    },
    key: (i: number) => [...store.keys()][i] ?? null,
  };
}

describe('siteGate', () => {
  beforeEach(() => {
    vi.stubGlobal('sessionStorage', mockStorage());
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
    expect((await verifySitePassword('anything')).ok).toBe(true);
  });

  it('rejects empty password when gate enabled', async () => {
    vi.stubEnv('VITE_AUTH_API_URL', 'https://auth.example.com');
    vi.resetModules();
    const { verifySitePassword } = await import('./siteGate');
    expect((await verifySitePassword('')).ok).toBe(false);
    expect((await verifySitePassword('   ')).ok).toBe(false);
  });

  it('stores signed session token on successful verify', async () => {
    vi.stubEnv('VITE_AUTH_API_URL', 'https://auth.example.com');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ ok: true, token: '123.uuid.sig', expiresAt: Date.now() + 3600000 }),
      }),
    );
    vi.resetModules();
    const { verifySitePassword } = await import('./siteGate');

    const result = await verifySitePassword('secret');
    expect(result.ok).toBe(true);
    expect(sessionStorage.getItem('couple-spin-auth-session')).toContain('123.uuid.sig');
  });

  it('returns rateLimited on HTTP 429', async () => {
    vi.stubEnv('VITE_AUTH_API_URL', 'https://auth.example.com');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 429, json: async () => ({ ok: false }) }),
    );
    vi.resetModules();
    const { verifySitePassword } = await import('./siteGate');
    expect(await verifySitePassword('secret')).toEqual({ ok: false, rateLimited: true });
  });

  it('restoreAuthSession validates stored token via /session', async () => {
    vi.stubEnv('VITE_AUTH_API_URL', 'https://auth.example.com');
    sessionStorage.setItem(
      'couple-spin-auth-session',
      JSON.stringify({ token: 'valid-token', expiresAt: Date.now() + 60000 }),
    );
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ ok: true }) }),
    );
    vi.resetModules();
    const { restoreAuthSession } = await import('./siteGate');
    expect(await restoreAuthSession()).toBe(true);
    expect(fetch).toHaveBeenCalledWith('https://auth.example.com/session', expect.any(Object));
  });

  it('clears expired session on restore', async () => {
    vi.stubEnv('VITE_AUTH_API_URL', 'https://auth.example.com');
    sessionStorage.setItem(
      'couple-spin-auth-session',
      JSON.stringify({ token: 'old', expiresAt: Date.now() - 1000 }),
    );
    vi.resetModules();
    const { restoreAuthSession } = await import('./siteGate');
    expect(await restoreAuthSession()).toBe(false);
    expect(sessionStorage.getItem('couple-spin-auth-session')).toBeNull();
  });
});
