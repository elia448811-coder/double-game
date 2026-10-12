import type { GameState } from '../types/game';

const SNAPSHOT_KEY = 'couple-spin-active-game';

export function saveSnapshot(game: GameState, syncCloud = true): void {
  if ((game.screen !== 'game' && !game.paused) || game.finishEventId) return;
  const snapshot = { ...game, screen: 'game' as const };
  try {
    sessionStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
    if (syncCloud) void import('./cloudSync').then(({ pushCloudSnapshot }) => pushCloudSnapshot(snapshot));
  } catch {}
}

export function loadSnapshot(): GameState | null {
  try {
    const raw = sessionStorage.getItem(SNAPSHOT_KEY);
    const value: unknown = raw ? JSON.parse(raw) : null;
    return isValidLocalSnapshot(value) ? prepareLocalResume(value) : null;
  } catch {
    return null;
  }
}

export function prepareLocalResume(game: GameState): GameState {
  return {
    ...game, screen: 'game', paused: false, isSpinning: false, uiBlocked: false, wheelLanded: false,
    timeDeadlineMs: game.timeLimitSeconds != null && !game.currentTask
      ? Date.now() + (game.timeRemainingSeconds ?? game.timeLimitSeconds) * 1000 : null,
  };
}

export function isValidLocalSnapshot(value: unknown): value is GameState {
  if (!value || typeof value !== 'object') return false;
  const g = value as GameState;
  const strings = (v: unknown) => Array.isArray(v) && v.every((s) => typeof s === 'string');
  const number = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v >= 0;
  return g.screen === 'game' && !g.finishEventId &&
    ['funny', 'romantic', 'challenge', 'calm', 'mixed', 'spicy'].includes(g.mode) &&
    ['easy', 'normal', 'advanced'].includes(g.level) && ['tasks', 'questions', 'mixed'].includes(g.contentMode) &&
    ['quick', 'normal', 'full', 'rounds', 'fun'].includes(g.gameFormat) &&
    ['competitive', 'cooperative', 'none'].includes(g.scoringMode) &&
    typeof g.playerOneName === 'string' && typeof g.playerTwoName === 'string' &&
    (g.currentPlayerIndex === 0 || g.currentPlayerIndex === 1) &&
    Array.isArray(g.scores) && g.scores.length === 2 && g.scores.every(number) && number(g.cooperativeScore) &&
    (g.favoriteTaskIds === undefined || strings(g.favoriteTaskIds)) &&
    strings(g.usedTaskIds) && strings(g.unlockedAchievements) && strings(g.sessionNewAchievements) &&
    !!g.stats && ['totalCompleted', 'totalSkipped', 'roundNumber', 'startTime', 'streak', 'maxStreak']
      .every((key) => number(g.stats[key as keyof GameState['stats']])) &&
    (g.timeRemainingSeconds == null || number(g.timeRemainingSeconds)) &&
    (g.timeLimitSeconds == null || number(g.timeLimitSeconds)) &&
    (g.currentTask === null || (!!g.currentTask && typeof g.currentTask.id === 'string' &&
      typeof g.currentTask.description === 'string' && typeof g.currentTask.title === 'string' &&
      typeof g.currentTask.category === 'string' && ['easy', 'normal', 'advanced'].includes(g.currentTask.level)));
}

export function clearSnapshot(): void {
  try {
    sessionStorage.removeItem(SNAPSHOT_KEY);
  } catch {}
}
