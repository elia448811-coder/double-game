/** סיסמת כניסה לאתר (ריק = שער כבוי) — מוזרקת ב-build מ-PASS_W */
export const SITE_PASS = typeof __SITE_PASS__ !== 'undefined' ? __SITE_PASS__ : '';

export function isSiteGateEnabled(): boolean {
  return SITE_PASS.length > 0;
}

export function verifySitePassword(input: string): boolean {
  if (!isSiteGateEnabled()) return true;
  return input.trim() === SITE_PASS;
}
