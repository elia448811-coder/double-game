import { accountSession, currentAccount } from './accountStorage';
import type { GameState } from '../types/game';
import { isValidLocalSnapshot } from './gameSnapshot';

const UNDO_KEY = 'couple-spin-undo';
let undoState: GameState | null = null;
let memoryOwner: string | null = null;

export function clearUndo(): void {
  undoState = null;
  try { accountSession.removeItem(UNDO_KEY); } catch {}
}

export function pushUndo(state: GameState): void {
  memoryOwner = currentAccount();
  undoState = state;
  try {
    accountSession.setItem(UNDO_KEY, JSON.stringify(state));
  } catch {}
}

export function popUndo(): GameState | null {
  const state = (memoryOwner === currentAccount() ? undoState : null) ?? readStoredUndo();
  undoState = null;
  try {
    accountSession.removeItem(UNDO_KEY);
  } catch {}
  return state;
}

export function hasUndo(): boolean {
  if (undoState && memoryOwner === currentAccount()) return true;
  try {
    return accountSession.getItem(UNDO_KEY) !== null;
  } catch {
    return false;
  }
}

function readStoredUndo(): GameState | null {
  try {
    const raw = accountSession.getItem(UNDO_KEY);
    const value: unknown = raw ? JSON.parse(raw) : null;
    return isValidLocalSnapshot(value) ? value : null;
  } catch {
    return null;
  }
}
