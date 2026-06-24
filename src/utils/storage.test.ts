import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from '../types/game';
import {
  loadSettings,
  loadUnlockedAchievements,
  saveSettings,
  saveUnlockedAchievements,
} from './storage';

describe('storage', () => {
  const store: Record<string, string> = {};

  beforeEach(() => {
    Object.keys(store).forEach((k) => delete store[k]);
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        Object.keys(store).forEach((k) => delete store[k]);
      },
      length: 0,
      key: () => null,
    });
  });

  it('returns defaults when empty', () => {
    const s = loadSettings();
    expect(s.lastContentMode).toBe('mixed');
    expect(s.soundEnabled).toBe(true);
  });

  it('merges partial saved settings with defaults', () => {
    saveSettings({ ...DEFAULT_SETTINGS, soundEnabled: false, lastContentMode: 'questions' });
    const s = loadSettings();
    expect(s.soundEnabled).toBe(false);
    expect(s.lastContentMode).toBe('questions');
    expect(s.playerOneName).toBe(DEFAULT_SETTINGS.playerOneName);
  });

  it('handles corrupt json gracefully', () => {
    store['couple-spin-settings'] = '{bad json';
    const s = loadSettings();
    expect(s.soundEnabled).toBe(true);
  });

  it('merges achievements without duplicates', () => {
    saveUnlockedAchievements(['first_game']);
    saveUnlockedAchievements(['streak_5', 'first_game']);
    const ids = loadUnlockedAchievements();
    expect(ids).toContain('first_game');
    expect(ids).toContain('streak_5');
    expect(ids.filter((id) => id === 'first_game').length).toBe(1);
  });
});
