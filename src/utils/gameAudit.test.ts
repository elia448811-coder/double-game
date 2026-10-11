import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAllContent } from '../data/allContent';
import { calculateSpinRotation } from '../hooks/useSpinWheel';
import { createTestGameState } from './gameSimulator';
import { gameReducer } from './gameReducer';
import { isValidLocalSnapshot, loadSnapshot, prepareLocalResume, saveSnapshot } from './gameSnapshot';
import { pickTaskWithFallback } from './pickTaskWithFallback';
import { filterTasks, pickEasierTask, pickHarderTask } from './taskSelection';
import { taskAllowedByBoundaries } from './privacy';

vi.mock('./cloudSync', () => ({ pushCloudSnapshot: vi.fn() }));

beforeEach(() => {
  vi.restoreAllMocks();
  const local = new Map<string, string>();
  const session = new Map<string, string>();
  const storage = (map: Map<string, string>) => ({
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => map.set(key, value),
    removeItem: (key: string) => map.delete(key),
  });
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { localStorage: storage(local) } });
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage(local) });
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: storage(session) });
});

describe('selection regressions', () => {
  it('harder means exactly one higher level; easier means one lower level', () => {
    for (let i = 0; i < 30; i++) {
      expect(pickHarderTask('mixed', 'easy', [], true)?.level).toBe('normal');
      expect(pickHarderTask('mixed', 'normal', [], true, { contentMode: 'questions' })?.level).toBe('advanced');
      expect(pickEasierTask('mixed', 'normal', [], true)?.level).toBe('easy');
      expect(pickEasierTask('mixed', 'advanced', [], true)?.level).toBe('normal');
    }
    expect(pickHarderTask('mixed', 'normal', [], false)).toBeNull();
    expect(pickHarderTask('mixed', 'advanced', [], true)).toBeNull();
    expect(pickEasierTask('mixed', 'easy', [], true)).toBeNull();
  });

  it('replacement excludes the current card even after the entire bank was used', () => {
    const pool = filterTasks('mixed', 'normal', [], true, { contentMode: 'questions' });
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const next = pickTaskWithFallback('mixed', 'normal', pool.map((t) => t.id), true,
      { contentMode: 'questions', excludeIds: [pool[0].id] });
    expect(next?.id).toBeTruthy();
    expect(next?.id).not.toBe(pool[0].id);
  });

  it('returns no card if every card is hidden, instead of bypassing restrictions', () => {
    localStorage.setItem('couple-spin-hidden-tasks', JSON.stringify(getAllContent().map((t) => t.id)));
    expect(pickTaskWithFallback('mixed', 'easy', [], false, { coupleOnly: true })).toBeNull();
  });

  it('fallback keeps mode, content, level and couple restrictions', () => {
    const task = pickTaskWithFallback('calm', 'easy', [], false,
      { preferredCategory: 'spicy', contentMode: 'questions', coupleOnly: true });
    expect(task?.kind).toBe('question');
    expect(task?.level).toBe('easy');
    expect(task?.category).not.toBe('spicy');
    expect(task?.isCoupleTask).toBe(true);
  });

  it('explicitly empty consent forbids all tagged activities', () => {
    localStorage.setItem('couple-spin-boundaries', JSON.stringify({ playerOne: [], playerTwo: [] }));
    for (const description of ['חיבוק', 'צילום סלפי', 'צאו החוצה', 'מגע אינטימי']) {
      expect(taskAllowedByBoundaries({ description })).toBe(false);
    }
    expect(taskAllowedByBoundaries({ description: 'ספרו בדיחה' })).toBe(true);
    const task = pickTaskWithFallback('romantic', 'easy', [], false, { preferredCategory: 'movement' });
    expect(task).toBeTruthy();
    expect(taskAllowedByBoundaries(task!)).toBe(true);
  });
});

describe('wheel destination', () => {
  it('always points to the selected segment after any number of earlier spins', () => {
    for (const count of [6, 7, 8, 9, 12]) {
      let current = 0;
      for (let turn = 0; turn < 100; turn++) {
        const index = turn % count;
        current = calculateSpinRotation(current, index, count, (turn % 100) / 100);
        const pointerAngle = ((360 - current % 360) + 360) % 360;
        expect(Math.floor(pointerAngle / (360 / count))).toBe(index);
      }
    }
  });
});

describe('timer and state transitions', () => {
  it('pause and repeated pause freeze the clock; resume keeps the remaining time', () => {
    let now = 1000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    const base = createTestGameState({ timeLimitSeconds: 10, timeRemainingSeconds: 10, timeDeadlineMs: 11000 });
    const paused = gameReducer(base, { type: 'PAUSE' }).state;
    expect(paused.timeDeadlineMs).toBeNull();
    now = 61000;
    const stillPaused = gameReducer(paused, { type: 'PAUSE' }).state;
    expect(stillPaused.timeRemainingSeconds).toBe(10);
    const resumed = gameReducer(stillPaused, { type: 'RESUME' }).state;
    expect(resumed.timeDeadlineMs).toBe(71000);
  });

  it('talking about a card does not consume time; completing restarts the clock', () => {
    let now = 1000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    const base = createTestGameState({ isSpinning: true, timeLimitSeconds: 20, timeRemainingSeconds: 20, timeDeadlineMs: 21000 });
    const task = getAllContent()[0];
    const landed = gameReducer(base, { type: 'SPIN_LANDED', task, label: 'בדיקה' }).state;
    expect(landed.timeDeadlineMs).toBeNull();
    now = 121000;
    const completed = gameReducer(landed, { type: 'TASK_COMPLETED', finishEventId: 'complete' }).state;
    expect(completed.timeDeadlineMs).toBe(141000);
  });

  it('ignores a late wheel callback after navigation or a game finish', () => {
    const base = createTestGameState({ isSpinning: true, uiBlocked: true });
    const home = gameReducer(base, { type: 'NAVIGATE', screen: 'welcome' }).state;
    const event = { type: 'SPIN_LANDED' as const, task: getAllContent()[0], label: 'בדיקה' };
    expect(gameReducer(home, event).state).toBe(home);
    const ended = gameReducer(base, { type: 'GAME_FINISHED', winner: 'tie', finishEventId: 'finish' }).state;
    expect(gameReducer(ended, event).state).toBe(ended);
  });

  it('paused games cannot complete, skip or replace a card', () => {
    const task = getAllContent()[0];
    const base = createTestGameState({ paused: true, currentTask: task });
    expect(gameReducer(base, { type: 'TASK_COMPLETED', finishEventId: 'x' }).state).toBe(base);
    expect(gameReducer(base, { type: 'TASK_SKIPPED', finishEventId: 'x' }).state).toBe(base);
    expect(gameReducer(base, { type: 'TASK_REPLACED', usedId: task.id, next: getAllContent()[1] }).state).toBe(base);
  });
});

describe('session restoration', () => {
  it('rejects broken and finished snapshots without crashing the application', () => {
    for (const value of [null, {}, [], { screen: 'game' }, createTestGameState({ screen: 'end' })]) {
      expect(isValidLocalSnapshot(value)).toBe(false);
    }
    sessionStorage.setItem('couple-spin-active-game', '{"screen":"game"}');
    expect(loadSnapshot()).toBeNull();
  });

  it('saves a paused game when navigating home and restores without a stuck spin', () => {
    const game = createTestGameState({ screen: 'welcome', paused: true, isSpinning: true, uiBlocked: true });
    saveSnapshot(game);
    const resumed = loadSnapshot();
    expect(resumed?.screen).toBe('game');
    expect(resumed?.paused).toBe(false);
    expect(resumed?.isSpinning).toBe(false);
    expect(resumed?.uiBlocked).toBe(false);
  });

  it('restoring a timer uses stored remaining time and keeps an open card paused', () => {
    vi.spyOn(Date, 'now').mockReturnValue(50000);
    const base = createTestGameState({ timeLimitSeconds: 20, timeRemainingSeconds: 8, timeDeadlineMs: 1 });
    expect(prepareLocalResume(base).timeDeadlineMs).toBe(58000);
    expect(prepareLocalResume({ ...base, currentTask: getAllContent()[0] }).timeDeadlineMs).toBeNull();
  });
});
