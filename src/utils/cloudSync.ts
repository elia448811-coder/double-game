import { accountLocal, currentAccount, accountGeneration } from './accountStorage';
import { getFirebaseAuth, getFirestoreDb, isFirebaseConfigured } from '../lib/firebase';
import type { CustomContentItem } from './customContent';
import { loadCustomContent } from './customContent';
import { loadProcessedFinishIds, applyProcessedFinishIds } from './finishPersistence';
import {
  isDiscreteMode,
  isGuestMode,
  loadBoundaries,
  type Boundaries,
} from './privacy';
import {
  loadHistory,
  visibleDeviceHistory,
  loadRecords,
  loadSettings,
  loadUnlockedAchievements,
  saveSettings,
  saveUnlockedAchievements,
  sanitizeSettings,
} from './storage';
import type { AppSettings, GameHistoryEntry, GameState, LocalRecords } from '../types/game';
import { isValidLocalSnapshot } from './gameSnapshot';
import { gameSyncData } from './gameSyncData';
import { CLOUD_DATA_APPLIED_EVENT, CLOUD_WATERMARK_KEY, markLocalCloudWatermark } from './cloudRevision';
export { markLocalCloudWatermark } from './cloudRevision';

export const SCHEMA_VERSION = 2;
const OUTBOX_KEY = 'couple-spin-cloud-outbox';
const WATERMARK_KEY = CLOUD_WATERMARK_KEY;
const HIDDEN_KEY = 'couple-spin-hidden-tasks';
const FAVORITES_KEY = 'couple-spin-favorites';
const DISCRETE_KEY = 'couple-spin-discrete';
const CUSTOM_KEY = 'couple-spin-custom-content';
const BOUNDARIES_KEY = 'couple-spin-boundaries';

export type CloudStatus =
  | { state: 'disabled'; reason: 'not_configured' | 'guest' }
  | { state: 'ok'; uid: string; projectId: string | null }
  | { state: 'error'; message: string };

export type SyncState = {
  status: 'idle' | 'syncing' | 'pending' | 'error';
  lastSyncMs: number | null;
  lastError: string | null;
};

export type CloudBundle = {
  updatedAtMs: number;
  schemaVersion: number;
  settings: AppSettings;
  history: GameHistoryEntry[];
  records: LocalRecords;
  achievements: string[];
  boundaries: Boundaries;
  boundariesUpdatedAtMs?: number;
  hiddenTasks: string[];
  favorites: string[];
  discrete: boolean;
  customContent: CustomContentItem[];
  processedFinishIds: string[];
};

type SyncListener = (state: SyncState) => void;

let syncState: SyncState = { status: 'idle', lastSyncMs: null, lastError: null };
const listeners = new Set<SyncListener>();
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let pushQueue: Promise<unknown> = Promise.resolve();

function emitSync(patch: Partial<SyncState>): void {
  syncState = { ...syncState, ...patch };
  // Settings can be persisted inside a React updater. Notify other components afterwards.
  queueMicrotask(() => listeners.forEach((fn) => fn(syncState)));
}

export function subscribeSyncState(listener: SyncListener): () => void {
  listeners.add(listener);
  listener(syncState);
  return () => listeners.delete(listener);
}

export function getSyncState(): SyncState {
  return syncState;
}

function canSync(): boolean {
  return isFirebaseConfigured() && !isGuestMode() && (Boolean(currentAccount()) || import.meta.env.MODE === 'test');
}

function readIds(key: string): string[] {
  try {
    const raw = accountLocal.getItem(key);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? [...new Set(parsed.filter((id): id is string => typeof id === 'string' && id.length <= 128))]
      : [];
  } catch {
    return [];
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    accountLocal.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export function readLocalCloudWatermark(): number {
  const raw = accountLocal.getItem(WATERMARK_KEY);
  const n = raw ? Number(raw) : 0;
  return Number.isFinite(n) ? n : 0;
}

export function localBundle(): CloudBundle {
  return {
    updatedAtMs: Date.now(),
    schemaVersion: SCHEMA_VERSION,
    settings: loadSettings(),
    history: loadHistory(),
    records: loadRecords(),
    achievements: loadUnlockedAchievements(),
    boundaries: loadBoundaries(),
    boundariesUpdatedAtMs: accountLocal.getItem(BOUNDARIES_KEY) === null ? 0
      : Number(accountLocal.getItem(BOUNDARIES_KEY + '-updated-at')) || Math.max(1, readLocalCloudWatermark()),
    hiddenTasks: readIds(HIDDEN_KEY),
    favorites: readIds(FAVORITES_KEY),
    discrete: isDiscreteMode(),
    customContent: loadCustomContent(),
    processedFinishIds: loadProcessedFinishIds(),
  };
}

export function mergeHistory(a: GameHistoryEntry[], b: GameHistoryEntry[]): GameHistoryEntry[] {
  const map = new Map<string, GameHistoryEntry>();
  for (const entry of [...a, ...b]) {
    const prev = map.get(entry.id);
    if (!prev || Date.parse(entry.date) >= Date.parse(prev.date)) map.set(entry.id, entry);
  }
  return [...map.values()]
    .sort((x, y) => Date.parse(y.date) - Date.parse(x.date))
    .slice(0, 20);
}

export function mergeRecords(a: LocalRecords, b: LocalRecords): LocalRecords {
  return {
    mostCompleted: Math.max(a.mostCompleted, b.mostCompleted),
    longestStreak: Math.max(a.longestStreak, b.longestStreak),
    totalGames: Math.max(a.totalGames, b.totalGames),
    totalTasks: Math.max(a.totalTasks, b.totalTasks),
  };
}

export function mergeBundles(local: CloudBundle, remote: CloudBundle): CloudBundle {
  const newerFirst = local.updatedAtMs >= remote.updatedAtMs ? local : remote;
  // Older clients sent empty default arrays even when nobody had chosen any boundaries.
  const consentTime = (bundle: CloudBundle) => bundle.boundariesUpdatedAtMs ??
    (bundle.boundaries.playerOne.length || bundle.boundaries.playerTwo.length ? bundle.updatedAtMs : 0);
  const localConsent = consentTime(local), remoteConsent = consentTime(remote);
  const consent = localConsent >= remoteConsent ? local : remote;
  return {
    updatedAtMs: Math.max(local.updatedAtMs, remote.updatedAtMs),
    schemaVersion: SCHEMA_VERSION,
    settings: newerFirst.settings,
    history: mergeHistory(local.history, remote.history),
    records: mergeRecords(local.records, remote.records),
    achievements: [...new Set([...local.achievements, ...remote.achievements])],
    boundaries: consent.boundaries,
    boundariesUpdatedAtMs: Math.max(localConsent, remoteConsent),
    hiddenTasks: [...new Set([...local.hiddenTasks, ...remote.hiddenTasks])],
    favorites: newerFirst.favorites,
    discrete: newerFirst.discrete,
    customContent: newerFirst.customContent,
    processedFinishIds: [...new Set([...local.processedFinishIds, ...remote.processedFinishIds])].slice(0, 200),
  };
}

export function applyCloudBundle(bundle: CloudBundle): void {
  saveSettings(bundle.settings);
  saveUnlockedAchievements(bundle.achievements);
  applyProcessedFinishIds(bundle.processedFinishIds);
  writeJson('couple-spin-history', visibleDeviceHistory(bundle.history));
  writeJson('couple-spin-records', bundle.records);
  if (bundle.boundariesUpdatedAtMs) {
    writeJson(BOUNDARIES_KEY, bundle.boundaries);
    accountLocal.setItem(BOUNDARIES_KEY + '-updated-at', String(bundle.boundariesUpdatedAtMs));
  } else {
    accountLocal.removeItem(BOUNDARIES_KEY);
    accountLocal.removeItem(BOUNDARIES_KEY + '-updated-at');
  }
  writeJson(HIDDEN_KEY, bundle.hiddenTasks);
  writeJson(FAVORITES_KEY, bundle.favorites);
  writeJson(DISCRETE_KEY, bundle.discrete);
  writeJson(CUSTOM_KEY, bundle.customContent);
  markLocalCloudWatermark(bundle.updatedAtMs);
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new Event(CLOUD_DATA_APPLIED_EVENT));
  }
}

function parseRemoteBundle(raw: Partial<CloudBundle>): CloudBundle {
  return {
    updatedAtMs: typeof raw.updatedAtMs === 'number' ? raw.updatedAtMs : 0,
    schemaVersion: typeof raw.schemaVersion === 'number' ? raw.schemaVersion : 1,
    settings: sanitizeSettings(raw.settings),
    history: Array.isArray(raw.history) ? (raw.history as GameHistoryEntry[]) : [],
    records: (raw.records as LocalRecords) ?? loadRecords(),
    achievements: Array.isArray(raw.achievements)
      ? raw.achievements.filter((id): id is string => typeof id === 'string')
      : [],
    boundaries: raw.boundaries ?? { playerOne: [], playerTwo: [] },
    boundariesUpdatedAtMs: raw.boundariesUpdatedAtMs,
    hiddenTasks: Array.isArray(raw.hiddenTasks) ? raw.hiddenTasks.filter((id) => typeof id === 'string') : [],
    favorites: Array.isArray(raw.favorites) ? raw.favorites.filter((id) => typeof id === 'string') : [],
    discrete: Boolean(raw.discrete),
    customContent: Array.isArray(raw.customContent) ? (raw.customContent as CustomContentItem[]) : [],
    processedFinishIds: Array.isArray(raw.processedFinishIds)
      ? raw.processedFinishIds.filter((id) => typeof id === 'string')
      : [],
  };
}

/** Anonymous auth for rooms — works even in guest mode (local privacy ≠ no Firebase Auth). */
export async function ensureAnonAuth() {
  if (!isFirebaseConfigured()) return null;
  const auth = await getFirebaseAuth();
  if (!auth) return null;
  if (auth.currentUser) return auth.currentUser;
  const { signInAnonymously } = await import('firebase/auth');
  const cred = await signInAnonymously(auth);
  return cred.user;
}

/** Anonymous auth for cloud sync — blocked in guest mode. */
export async function ensureAnonUser() {
  if (!canSync()) return null;
  const auth = await getFirebaseAuth();
  const user = auth?.currentUser;
  return user && (user.uid === currentAccount() || (import.meta.env.MODE === 'test' && !currentAccount())) ? user : null;
}

export async function pingFirestore(): Promise<CloudStatus> {
  if (!isFirebaseConfigured()) return { state: 'disabled', reason: 'not_configured' };
  if (isGuestMode()) return { state: 'disabled', reason: 'guest' };
  try {
    const user = await ensureAnonUser();
    const db = await getFirestoreDb();
    if (!user || !db) return { state: 'error', message: 'firebase_init_failed' };
    const { doc, getDoc, serverTimestamp, setDoc } = await import('firebase/firestore');
    const ref = doc(db, 'users', user.uid, 'meta', 'health');
    await setDoc(
      ref,
      { ok: true, at: serverTimestamp(), schemaVersion: SCHEMA_VERSION, client: 'couple-spin' },
      { merge: true },
    );
    const snap = await getDoc(ref);
    if (!snap.exists()) return { state: 'error', message: 'health_missing' };
    return {
      state: 'ok',
      uid: user.uid,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim() || null,
    };
  } catch (error) {
    return {
      state: 'error',
      message: error instanceof Error ? error.message : 'ping_failed',
    };
  }
}

function queueOutbox(): void {
  try {
    accountLocal.setItem(OUTBOX_KEY, '1');
    emitSync({ status: 'pending' });
  } catch {
    // ignore
  }
}

function clearOutbox(): void {
  try {
    accountLocal.removeItem(OUTBOX_KEY);
  } catch {
    // ignore
  }
}

function hasOutbox(): boolean {
  return accountLocal.getItem(OUTBOX_KEY) === '1';
}

export function pushUserData(): Promise<{ ok: boolean; error?: string }> {
  // Startup, autosave and manual save must finish in order within this device.
  const generation = accountGeneration();
  const uploadNow = () => generation === accountGeneration() ? pushUserDataNow(generation) : { ok: false, error: 'account_changed' };
  const upload = pushQueue.then(uploadNow, uploadNow);
  pushQueue = upload;
  return upload;
}

async function pushUserDataNow(generation: number): Promise<{ ok: boolean; error?: string }> {
  if (!canSync()) return { ok: false, error: 'sync_disabled' };
  emitSync({ status: 'syncing', lastError: null });
  try {
    const user = await ensureAnonUser();
    const db = await getFirestoreDb();
    if (!user || !db) {
      emitSync({ status: 'error', lastError: 'firebase_init_failed' });
      return { ok: false, error: 'firebase_init_failed' };
    }
    const { doc, runTransaction, serverTimestamp } = await import('firebase/firestore');
    if (generation !== accountGeneration() || !canSync()) return { ok: false, error: 'account_changed' };
    const ref = doc(db, 'users', user.uid, 'data', 'bundle');
    const localRevision = readLocalCloudWatermark();
    const bundle = { ...localBundle(), updatedAtMs: localRevision || Date.now() };
    const merged = await runTransaction(db, async (tx) => {
      const existing = await tx.get(ref);
      if (generation !== accountGeneration() || !canSync()) throw new Error('account_changed');
      const next = existing.exists() ? mergeBundles(bundle, parseRemoteBundle(existing.data())) : bundle;
      next.updatedAtMs = Math.max(Date.now(), next.updatedAtMs);
      // Strip undefined optional fields before adding the Firestore timestamp.
      tx.set(ref, { ...JSON.parse(JSON.stringify(next)), updatedAt: serverTimestamp() });
      return next;
    });
    if (generation !== accountGeneration() || !canSync()) return { ok: false, error: 'account_changed' };
    const settings = loadSettings();
    const { ensureUserProfile } = await import('./userProfile');
    if (generation !== accountGeneration()) return { ok: false, error: 'account_changed' };
    await ensureUserProfile({
      displayName: settings.playerOneName,
      partnerDisplayName: settings.playerTwoName,
      avatar: settings.playerOneAvatar,
    });
    if (generation !== accountGeneration() || !canSync()) return { ok: false, error: 'account_changed' };
    if (readLocalCloudWatermark() !== localRevision) {
      // A newer edit must not be replaced by the snapshot this request uploaded.
      scheduleCloudPush(0);
      return { ok: true };
    }
    applyCloudBundle(merged);
    clearOutbox();
    emitSync({ status: 'idle', lastSyncMs: Date.now(), lastError: null });
    return { ok: true };
  } catch (error) {
    if (generation !== accountGeneration()) return { ok: false, error: 'account_changed' };
    const message = error instanceof Error ? error.message : 'push_failed';
    queueOutbox();
    emitSync({ status: 'error', lastError: message });
    return { ok: false, error: message };
  }
}

export async function pullUserData(): Promise<{ ok: boolean; bundle?: CloudBundle; error?: string }> {
  const generation = accountGeneration();
  if (!canSync()) return { ok: false, error: 'sync_disabled' };
  emitSync({ status: 'syncing', lastError: null });
  try {
    const user = await ensureAnonUser();
    const db = await getFirestoreDb();
    if (!user || !db) {
      emitSync({ status: 'error', lastError: 'firebase_init_failed' });
      return { ok: false, error: 'firebase_init_failed' };
    }
    const { doc, getDoc } = await import('firebase/firestore');
    const snap = await getDoc(doc(db, 'users', user.uid, 'data', 'bundle'));
    if (generation !== accountGeneration() || !canSync()) return { ok: false, error: 'account_changed' };
    if (!snap.exists()) {
      emitSync({ status: 'idle', lastSyncMs: Date.now() });
      return { ok: true };
    }
    const remote = parseRemoteBundle(snap.data() as Partial<CloudBundle>);
    // Opening a fresh device does not make its default settings newer than the cloud.
    const local = { ...localBundle(), updatedAtMs: readLocalCloudWatermark() };
    const merged = mergeBundles(local, remote);
    if (local.updatedAtMs > remote.updatedAtMs) {
      const uploaded = await pushUserData();
      if (!uploaded.ok) return uploaded;
      emitSync({ status: 'idle', lastSyncMs: Date.now() });
      return { ok: true, bundle: localBundle() };
    }
    applyCloudBundle(merged);
    emitSync({ status: 'idle', lastSyncMs: Date.now(), lastError: null });
    return { ok: true, bundle: merged };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'pull_failed';
    emitSync({ status: 'error', lastError: message });
    return { ok: false, error: message };
  }
}

export async function syncCloudOnStartup(): Promise<boolean> {
  if (!canSync()) return false;
  try {
    const { ensureUserProfile } = await import('./userProfile');
    await ensureUserProfile();
  } catch {
    /* profile is best-effort */
  }
  const result = await pullUserData();
  if (hasOutbox()) await pushUserData();
  return result.ok;
}

export function scheduleCloudPush(delayMs = 800): void {
  if (!canSync()) return;
  // Record the edit immediately, including while startup is still downloading data.
  markLocalCloudWatermark();
  queueOutbox();
  if (pushTimer) clearTimeout(pushTimer);
  const generation = accountGeneration();
  pushTimer = setTimeout(() => {
    pushTimer = null;
    if (generation === accountGeneration()) void pushUserData();
  }, delayMs);
}

const SNAPSHOT_OUTBOX = 'couple-spin-snapshot-outbox';
type SnapshotEdit = { game: GameState | null; start: number; at: number; id: string };
let snapshotQueue: Promise<void> = Promise.resolve();

async function flushCloudSnapshot(): Promise<void> {
  const generation = accountGeneration();
  const send = async () => {
    if (!canSync() || generation !== accountGeneration()) return;
    let pending: string | null = null;
    try {
      pending = accountLocal.getItem(SNAPSHOT_OUTBOX);
      if (!pending) return;
      const edit = JSON.parse(pending) as SnapshotEdit;
      const user = await ensureAnonUser();
      const db = await getFirestoreDb();
      if (!user || !db || generation !== accountGeneration()) return;
      const { doc, runTransaction, serverTimestamp } = await import('firebase/firestore');
      const ref = doc(db, 'users', user.uid, 'data', 'activeGame');
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        if (generation !== accountGeneration() || !canSync()) return;
        const remote = snap.data();
        const currentStart = Number(remote?.game?.stats?.startTime ?? 0);
        const closedThrough = Number(remote?.closedThroughStartMs ?? 0);
        if (edit.game) {
          if ((closedThrough && edit.start <= closedThrough) || currentStart > edit.start ||
              (currentStart === edit.start && Number(remote?.updatedAtMs ?? 0) > edit.at)) return;
        } else if (currentStart > edit.start) return;
        tx.set(ref, {
          game: edit.game, closedThroughStartMs: edit.game ? closedThrough : Math.max(closedThrough, edit.start),
          updatedAtMs: edit.at, updatedAt: serverTimestamp(),
        });
      });
      if (generation === accountGeneration() && accountLocal.getItem(SNAPSHOT_OUTBOX) === pending) accountLocal.removeItem(SNAPSHOT_OUTBOX);
    } catch { /* Retain this account's pending edit for reconnect or startup. */ }
  };
  snapshotQueue = snapshotQueue.then(send, send);
  return snapshotQueue;
}

function queueSnapshot(game: GameState | null, start: number): Promise<void> {
  if (!canSync()) return Promise.resolve();
  try {
    accountLocal.setItem(SNAPSHOT_OUTBOX, JSON.stringify({ game, start, at: Date.now(), id: crypto.randomUUID() }));
  } catch { return Promise.resolve(); }
  return flushCloudSnapshot();
}

export function pushCloudSnapshot(game: GameState): Promise<void> {
  if (game.screen !== 'game' || game.finishEventId) return Promise.resolve();
  return queueSnapshot(gameSyncData(game), game.stats.startTime);
}

export function closeCloudSnapshot(start: number): Promise<void> {
  return queueSnapshot(null, start);
}

export async function pullCloudSnapshot(): Promise<GameState | null> {
  if (!canSync()) return null;
  const generation = accountGeneration();
  try {
    await flushCloudSnapshot();
    if (generation !== accountGeneration()) return null;
    const user = await ensureAnonUser();
    const db = await getFirestoreDb();
    if (!user || !db) return null;
    const { doc, getDoc } = await import('firebase/firestore');
    const snap = await getDoc(doc(db, 'users', user.uid, 'data', 'activeGame'));
    if (generation !== accountGeneration() || !canSync()) return null;
    const pending = accountLocal.getItem(SNAPSHOT_OUTBOX);
    const game = pending ? (JSON.parse(pending) as SnapshotEdit).game : snap.data()?.game;
    return isValidLocalSnapshot(game) ? game : null;
  } catch {
    return null;
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    void flushCloudSnapshot();
    if (hasOutbox()) void pushUserData();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      void flushCloudSnapshot();
      if (hasOutbox()) void pushUserData();
    }
  });
}

/** @deprecated use applyCloudBundle via pullUserData */
export function applyCloudBundleIfNewer(bundle: CloudBundle, localUpdatedAtMs: number): boolean {
  if (!bundle.updatedAtMs || bundle.updatedAtMs <= localUpdatedAtMs) return false;
  applyCloudBundle(bundle);
  return true;
}
