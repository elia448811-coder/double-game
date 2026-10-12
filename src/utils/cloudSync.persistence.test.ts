import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from '../types/game';
import { loadSettings, saveSettings } from './storage';
import { pullUserData, pushCloudSnapshot, scheduleCloudPush, subscribeSyncState } from './cloudSync';

const backend = vi.hoisted(() => ({ getDoc: vi.fn(), setDoc: vi.fn() }));
vi.mock('../lib/firebase', () => ({
  isFirebaseConfigured: () => true,
  getFirebaseAuth: async () => ({ currentUser: { uid: 'qa-sync', email: 'qa@example.test' } }),
  getFirestoreDb: async () => ({}),
}));
vi.mock('firebase/firestore', () => ({
  doc: () => ({}), getDoc: backend.getDoc, setDoc: backend.setDoc, serverTimestamp: () => 'timestamp',
}));
vi.mock('./userProfile', () => ({ ensureUserProfile: async () => null }));

function remoteSnapshot() {
  return { exists: () => true, data: () => ({
    updatedAtMs: 1000, schemaVersion: 2,
    settings: { ...DEFAULT_SETTINGS, theme: 'light', calmDisplay: true },
    history: [], records: { mostCompleted: 0, longestStreak: 0, totalGames: 0, totalTasks: 0 },
    achievements: [], boundaries: { playerOne: [], playerTwo: [] }, hiddenTasks: [],
    favorites: [], discrete: false, customContent: [], processedFinishIds: [],
  }) };
}

describe('cloud settings on new devices and during startup', () => {
  beforeEach(() => {
    vi.useFakeTimers(); vi.setSystemTime(10000); vi.clearAllMocks();
    const store = new Map<string, string>();
    const storage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value); },
      removeItem: (key: string) => { store.delete(key); },
    };
    vi.stubGlobal('localStorage', storage); vi.stubGlobal('window', { localStorage: storage });
    backend.getDoc.mockResolvedValue(remoteSnapshot()); backend.setDoc.mockResolvedValue(undefined);
  });
  afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals(); });

  it('loads saved cloud settings on a fresh device without uploading defaults', async () => {
    expect(loadSettings().theme).toBe('dark');
    expect((await pullUserData()).ok).toBe(true);
    expect(loadSettings()).toMatchObject({ theme: 'light', calmDisplay: true });
    expect(backend.setDoc).not.toHaveBeenCalled();
  });

  it('preserves an edit made while the startup download is in flight', async () => {
    let resolveDownload!: (snapshot: ReturnType<typeof remoteSnapshot>) => void;
    const download = new Promise<ReturnType<typeof remoteSnapshot>>((resolve) => { resolveDownload = resolve; });
    backend.getDoc.mockReturnValueOnce(download);
    const pull = pullUserData();
    await vi.waitFor(() => expect(backend.getDoc).toHaveBeenCalled());
    saveSettings({ ...DEFAULT_SETTINGS, theme: 'dark', calmDisplay: false, playerOneName: 'Local edit' });
    scheduleCloudPush(); resolveDownload(remoteSnapshot());
    expect((await pull).ok).toBe(true);
    expect(loadSettings()).toMatchObject({ theme: 'dark', calmDisplay: false, playerOneName: 'Local edit' });
    expect(backend.setDoc.mock.calls[0]?.[1].settings.playerOneName).toBe('Local edit');
  });

  it('keeps an edit queued when the page closes before the delayed upload', async () => {
    saveSettings({ ...DEFAULT_SETTINGS, playerOneName: 'Saved before reload' });
    scheduleCloudPush();
    expect(localStorage.getItem('couple-spin-cloud-outbox')).toBe('1');
    vi.clearAllTimers();
    expect((await pullUserData()).ok).toBe(true);
    expect(loadSettings().playerOneName).toBe('Saved before reload');
    expect(localStorage.getItem('couple-spin-cloud-outbox')).toBeNull();
  });
  it('stores a regular evening without undefined optional fields', async () => {
    await pushCloudSnapshot({ screen: 'game', finishEventId: null, favoriteTaskIds: undefined } as never);
    expect(backend.setDoc).toHaveBeenCalledOnce();
    expect(backend.setDoc.mock.calls[0]?.[1].game).toEqual({ screen: 'game', finishEventId: null });
  });
  it('notifies sync subscribers after the settings updater has returned', async () => {
    let insideUpdater = false;
    const notifiedDuringUpdate: boolean[] = [];
    const stop = subscribeSyncState(() => { notifiedDuringUpdate.push(insideUpdater); });
    insideUpdater = true; scheduleCloudPush(); insideUpdater = false;
    await Promise.resolve();
    expect(notifiedDuringUpdate.every((inside) => !inside)).toBe(true); stop();
  });
});
