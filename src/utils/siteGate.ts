/** כתובת שרת האימות — הסיסמה לא נמצאת בקוד האתר */
const AUTH_API = (import.meta.env.VITE_AUTH_API_URL ?? '').replace(/\/$/, '');
const SESSION_KEY = 'couple-spin-auth-session';

export type AuthSession = {
  token: string;
  expiresAt: number;
};

export function getAuthApiUrl(): string {
  return AUTH_API;
}

export function isSiteGateEnabled(): boolean {
  return AUTH_API.length > 0;
}

function readStoredSession(): AuthSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.token || !parsed.expiresAt) return null;
    if (Date.now() >= parsed.expiresAt) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return parsed;
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function clearAuthSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export function saveAuthSession(session: AuthSession): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export async function validateAuthSession(token: string): Promise<boolean> {
  if (!isSiteGateEnabled() || !token) return false;

  try {
    const res = await fetch(`${AUTH_API}/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { ok?: boolean };
    return data.ok === true;
  } catch {
    return false;
  }
}

export async function restoreAuthSession(): Promise<boolean> {
  if (!isSiteGateEnabled()) return true;

  const stored = readStoredSession();
  if (!stored) return false;

  const ok = await validateAuthSession(stored.token);
  if (!ok) clearAuthSession();
  return ok;
}

export async function verifySitePassword(input: string): Promise<{ ok: boolean; rateLimited?: boolean }> {
  if (!isSiteGateEnabled()) return { ok: true };

  const password = input.trim();
  if (!password) return { ok: false };

  try {
    const res = await fetch(`${AUTH_API}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (res.status === 429) return { ok: false, rateLimited: true };

    if (!res.ok) {
      clearAuthSession();
      return { ok: false };
    }

    const data = (await res.json()) as { ok?: boolean; token?: string; expiresAt?: number };
    if (data.ok !== true) return { ok: false };

    if (data.token && data.expiresAt) {
      saveAuthSession({ token: data.token, expiresAt: data.expiresAt });
    }

    return { ok: true };
  } catch {
    return { ok: false };
  }
}
