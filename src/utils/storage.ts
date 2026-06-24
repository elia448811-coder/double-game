import { DEFAULT_SETTINGS, type AppSettings, type GameHistoryEntry, type LocalRecords } from '../types/game';

const SETTINGS_KEY = 'couple-spin-settings';
const HISTORY_KEY = 'couple-spin-history';
const RECORDS_KEY = 'couple-spin-records';
const ACHIEVEMENTS_KEY = 'couple-spin-achievements';

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadHistory(): GameHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveHistoryEntry(entry: GameHistoryEntry): void {
  const history = loadHistory().slice(0, 19);
  localStorage.setItem(HISTORY_KEY, JSON.stringify([entry, ...history]));
}

export function loadRecords(): LocalRecords {
  try {
    const raw = localStorage.getItem(RECORDS_KEY);
    return raw
      ? JSON.parse(raw)
      : { mostCompleted: 0, longestStreak: 0, totalGames: 0, totalTasks: 0 };
  } catch {
    return { mostCompleted: 0, longestStreak: 0, totalGames: 0, totalTasks: 0 };
  }
}

export function updateRecords(partial: Partial<LocalRecords>): LocalRecords {
  const current = loadRecords();
  const next = { ...current, ...partial };
  localStorage.setItem(RECORDS_KEY, JSON.stringify(next));
  return next;
}

export function loadUnlockedAchievements(): string[] {
  try {
    const raw = localStorage.getItem(ACHIEVEMENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveUnlockedAchievements(ids: string[]): void {
  const merged = [...new Set([...loadUnlockedAchievements(), ...ids])];
  localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(merged));
}
