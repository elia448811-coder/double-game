/** כתובת שרת האימות — הסיסמה לא נמצאת בקוד האתר */
const AUTH_API = (import.meta.env.VITE_AUTH_API_URL ?? '').replace(/\/$/, '');

export function getAuthApiUrl(): string {
  return AUTH_API;
}

export function isSiteGateEnabled(): boolean {
  return AUTH_API.length > 0;
}

export async function verifySitePassword(input: string): Promise<boolean> {
  if (!isSiteGateEnabled()) return true;

  const password = input.trim();
  if (!password) return false;

  try {
    const res = await fetch(`${AUTH_API}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (!res.ok) return false;

    const data = (await res.json()) as { ok?: boolean };
    return data.ok === true;
  } catch {
    return false;
  }
}
