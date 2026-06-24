/** סיסמת כניסה לאתר (ריק = שער כבוי) */
export const SITE_PASS = typeof __SITE_PASS__ !== 'undefined' ? __SITE_PASS__ : '';

const SESSION_KEY = 'couple-spin-gate-ok';

export function isSiteGateEnabled(): boolean {
  return SITE_PASS.length > 0;
}

export function readGateSession(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

export function writeGateSession(): void {
  try {
    sessionStorage.setItem(SESSION_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function verifySitePassword(input: string): boolean {
  if (!isSiteGateEnabled()) return true;
  return input === SITE_PASS;
}
