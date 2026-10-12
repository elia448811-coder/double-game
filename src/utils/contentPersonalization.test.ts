import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAllContent } from '../data/allContent';
import { DEFAULT_SETTINGS, type CoupleTask } from '../types/game';
import { clearContentMemory, loadSeenContent, rememberContent, SEEN_CONTENT_KEY } from './contentMemory';
import { choosePreferredContent, filterTasks } from './taskSelection';
import { pickTaskWithFallback } from './pickTaskWithFallback';
import { readTaskMap, setTaskFeedback } from './taskFeedback';
import { gameReducer } from './gameReducer';
import { createTestGameState } from './gameSimulator';
import { isValidLocalSnapshot } from './gameSnapshot';
import { clearAllLocalData, sanitizeSettings } from './storage';
import { exportAllData, importAllData } from './privacy';

vi.mock('./cloudSync', () => ({ scheduleCloudPush: vi.fn() }));
beforeEach(() => {
  vi.restoreAllMocks();
  const data = new Map<string, string>();
  const store = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => data.set(key, value), removeItem: (key: string) => data.delete(key) };
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { localStorage: store } });
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: store });
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: store });
});
const sample = (id: string): CoupleTask => ({ id, title: id, description: id, category: 'calm', level: 'easy', kind: 'question' });

describe('content memory and preference selection', () => {
  it('prefers a new card across reloads, then reuses older cards when the pool is exhausted', () => {
    const a = sample('seen-a'); const b = sample('seen-b'); const c = sample('new');
    localStorage.setItem(SEEN_CONTENT_KEY, JSON.stringify([{ id: a.id, atMs: Date.now() - 1000 }, { id: b.id, atMs: Date.now() - 2000 }]));
    for (const random of [0, .2, .7, .99]) expect(choosePreferredContent([a, b, c], {}, random)?.id).toBe(c.id);
    rememberContent(c.id);
    expect(choosePreferredContent([a, b, c])?.id).toBe(b.id);
    expect(choosePreferredContent([a], {})?.id).toBe(a.id);
  });
  it('allows intentional repeats in a favorites evening or when novelty is turned off', () => {
    const a = sample('seen'); const b = sample('new'); rememberContent(a.id);
    expect(choosePreferredContent([a, b], { allowedIds: [a.id, b.id] }, 0)?.id).toBe(a.id);
    expect(choosePreferredContent([a, b], { preferUnseen: false }, 0)?.id).toBe(a.id);
  });
  it('likes increase and dislikes reduce frequency while keeping all eligible cards possible', () => {
    const liked = sample('liked'); const neutral = sample('neutral'); const disliked = sample('disliked');
    setTaskFeedback(liked.id, 'up'); setTaskFeedback(disliked.id, 'down');
    const counts = { liked: 0, neutral: 0, disliked: 0 };
    for (let index = 0; index < 1000; index++) {
      const item = choosePreferredContent([liked, neutral, disliked], { preferUnseen: false }, (index + .5) / 1000)!;
      counts[item.id as keyof typeof counts]++;
    }
    expect(counts.liked).toBeGreaterThan(counts.neutral * 2);
    expect(counts.disliked).toBeLessThan(counts.neutral / 2);
    expect(counts.disliked).toBeGreaterThan(0);
    expect(choosePreferredContent([liked, neutral, disliked], { personalize: false, preferUnseen: false }, .5)?.id).toBe(neutral.id);
  });
  it('uses topic feedback to prioritize similar unseen content', () => {
    const bank = getAllContent().filter((item) => item.category !== 'spicy');
    const positive = bank.find((item) => item.category === 'funny' && item.kind === 'question')!;
    const similar = bank.find((item) => item.id !== positive.id && item.kind === positive.kind && (item.questionGroup ?? item.category) === (positive.questionGroup ?? positive.category))!;
    const other = bank.find((item) => item.kind === 'question' && (item.questionGroup ?? item.category) !== (positive.questionGroup ?? positive.category))!;
    setTaskFeedback(positive.id, 'up');
    expect(choosePreferredContent([similar, other], { preferUnseen: false }, .51)?.id).toBe(similar.id);
    expect(choosePreferredContent([similar, other], { personalize: false, preferUnseen: false }, .51)?.id).toBe(other.id);
  });
  it('keeps favorites and replacement exclusions strict during every fallback', () => {
    const card = filterTasks('mixed', 'normal', [], true, { contentMode: 'questions' })[0];
    expect(pickTaskWithFallback('mixed', 'normal', [], true, { contentMode: 'questions', allowedIds: [card.id], preferredCategory: 'movement' })?.id).toBe(card.id);
    expect(pickTaskWithFallback('mixed', 'normal', [card.id], true, { contentMode: 'questions', allowedIds: [card.id], excludeIds: [card.id] })).toBeNull();
    expect(pickTaskWithFallback('mixed', 'normal', [], true, { allowedIds: [] })).toBeNull();
    const mature = getAllContent().find((item) => item.category === 'spicy')!;
    expect(pickTaskWithFallback('mixed', 'advanced', [], true, { contentMode: 'mixed', allowedIds: [mature.id] })).toBeNull();
    localStorage.setItem('couple-spin-hidden-tasks', JSON.stringify([card.id]));
    expect(pickTaskWithFallback('mixed', 'normal', [], true, { contentMode: 'questions', allowedIds: [card.id] })).toBeNull();
  });
  it('never lets feedback bypass boundaries or disabled advanced content', () => {
    const card = getAllContent().find((item) => item.level === 'advanced' && item.category !== 'spicy')!;
    setTaskFeedback(card.id, 'up');
    expect(pickTaskWithFallback('mixed', 'advanced', [], false, { contentMode: 'mixed', allowedIds: [card.id] })).toBeNull();
    const touch: CoupleTask = { ...sample('touch'), description: 'חיבוק' };
    localStorage.setItem('couple-spin-custom-content', JSON.stringify([{ ...touch, createdAt: Date.now() }]));
    localStorage.setItem('couple-spin-boundaries', JSON.stringify({ playerOne: [], playerTwo: [] }));
    expect(getAllContent().some((item) => item.id === touch.id)).toBe(true);
    expect(filterTasks('mixed', 'easy', [], true, { contentMode: 'mixed' }).some((item) => item.id === touch.id)).toBe(false);
  });
  it('retains identifiers only, expires old data, bounds size and ignores corrupt storage', () => {
    rememberContent('a'); rememberContent('a');
    expect(loadSeenContent()).toHaveLength(1);
    const data = JSON.parse(localStorage.getItem(SEEN_CONTENT_KEY)!);
    expect(Object.keys(data[0]).sort()).toEqual(['atMs', 'id']);
    const now = Date.now();
    localStorage.setItem(SEEN_CONTENT_KEY, JSON.stringify([{ id: 'expired', atMs: now - 91 * 86400000 }, { id: 'future', atMs: now + 100000 }, ...Array.from({ length: 1200 }, (_, i) => ({ id: `id-${i}`, atMs: now - i }))]));
    expect(loadSeenContent(now)).toHaveLength(1000);
    expect(loadSeenContent(now).some((item) => ['expired', 'future'].includes(item.id))).toBe(false);
    localStorage.setItem(SEEN_CONTENT_KEY, 'broken'); expect(loadSeenContent()).toEqual([]);
    localStorage.setItem('couple-spin-task-feedback', JSON.stringify({ valid: 'up', bad: 'banana' })); expect(readTaskMap()).toEqual({ valid: 'up' });
  });
  it('does not store seen content in guest mode or break play when storage is unavailable', () => {
    localStorage.setItem('couple-spin-guest', 'true'); rememberContent('guest');
    setTaskFeedback('guest', 'up');
    expect(readTaskMap()).toEqual({}); expect(localStorage.getItem('couple-spin-task-feedback')).toBeNull();
    expect(localStorage.getItem(SEEN_CONTENT_KEY)).toBeNull();
    Object.defineProperty(globalThis, 'window', { configurable: true, value: { get localStorage() { throw new Error('denied'); } } });
    expect(() => rememberContent('denied')).not.toThrow(); expect(loadSeenContent()).toEqual([]);
  });
  it('exports, imports, resets and deletes preference data with the existing privacy controls', () => {
    rememberContent('remember'); setTaskFeedback('remember', 'up');
    const backup = exportAllData(); clearContentMemory(); expect(loadSeenContent()).toEqual([]);
    expect(importAllData(backup).ok).toBe(true); expect(loadSeenContent()[0]?.id).toBe('remember');
    clearAllLocalData(); expect(loadSeenContent()).toEqual([]); expect(readTaskMap()).toEqual({});
  });
  it('preserves favorites when replaying but clears them for a new regular evening', () => {
    const state = createTestGameState({ favoriteTaskIds: ['a'] });
    expect(gameReducer(state, { type: 'PLAY_AGAIN' }).state.favoriteTaskIds).toEqual(['a']);
    expect(gameReducer(state, { type: 'NEW_GAME', settingsNames: { one: 'א', two: 'ב', contentMode: 'mixed' } }).state.favoriteTaskIds).toBeUndefined();
    expect(isValidLocalSnapshot(state)).toBe(true);
    expect(isValidLocalSnapshot({ ...state, favoriteTaskIds: 'broken' })).toBe(false);
  });
  it('loads existing settings safely and persists all new switches', () => {
    expect(sanitizeSettings({})).toEqual(DEFAULT_SETTINGS);
    const settings = sanitizeSettings({ calmDisplay: true, personalizeContent: false, preferUnseenContent: false });
    expect(settings.calmDisplay).toBe(true); expect(settings.personalizeContent).toBe(false); expect(settings.preferUnseenContent).toBe(false);
  });
});
