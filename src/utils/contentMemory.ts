import { isGuestMode } from './privacy';

export const SEEN_CONTENT_KEY = 'couple-spin-seen-content';
const MAX_ITEMS = 1000;
const RETENTION_MS = 90 * 24 * 60 * 60 * 1000;
type SeenItem = { id: string; atMs: number };

/** Store identifiers only, never the players' answers. */
export function loadSeenContent(now = Date.now()): SeenItem[] {
  if (typeof window === 'undefined') return [];
  try {
    if (isGuestMode()) return [];
    const raw: unknown = JSON.parse(localStorage.getItem(SEEN_CONTENT_KEY) ?? '[]');
    if (!Array.isArray(raw)) return [];
    const ids = new Set<string>();
    return raw.filter((item): item is SeenItem => {
      if (!item || typeof item.id !== 'string' || !item.id || item.id.length > 128 ||
        !Number.isFinite(item.atMs) || item.atMs > now || item.atMs < now - RETENTION_MS || ids.has(item.id)) return false;
      ids.add(item.id);
      return true;
    }).sort((a, b) => b.atMs - a.atMs).slice(0, MAX_ITEMS);
  } catch { return []; }
}

export function rememberContent(id: string): void {
  if (!id || id.length > 128 || typeof window === 'undefined') return;
  try {
    if (isGuestMode()) return;
    localStorage.setItem(SEEN_CONTENT_KEY, JSON.stringify([
      { id, atMs: Date.now() }, ...loadSeenContent().filter((item) => item.id !== id),
    ].slice(0, MAX_ITEMS)));
  } catch { /* Playing must remain possible when storage is full or disabled. */ }
}

export function clearContentMemory(): void {
  try { localStorage.removeItem(SEEN_CONTENT_KEY); } catch { /* optional storage */ }
}
