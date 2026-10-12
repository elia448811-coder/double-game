import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { subscribeCoupleRoom } from './coupleRoom';

type Snapshot = { exists: () => boolean; data: () => Record<string, unknown>; metadata: { fromCache: boolean } };
const backend = vi.hoisted(() => ({
  getDb: vi.fn(), onSnapshot: vi.fn(), stop: vi.fn(),
  next: undefined as undefined | ((snapshot: Snapshot) => void),
}));
vi.mock('../lib/firebase', () => ({ isFirebaseConfigured: () => true, getFirestoreDb: backend.getDb }));
vi.mock('firebase/firestore', () => ({ doc: () => ({}), onSnapshot: backend.onSnapshot }));
const snapshot = (exists: boolean, fromCache: boolean): Snapshot => ({
  exists: () => exists, metadata: { fromCache },
  data: () => ({ hostUid: 'host', partnerUid: 'partner', displayCode: '12345678', expiresAtMs: Date.now() + 60000 }),
});

describe('room subscription after a partner transaction', () => {
  beforeEach(() => {
    vi.clearAllMocks(); backend.next = undefined; backend.getDb.mockResolvedValue({});
    backend.onSnapshot.mockImplementation((_ref: unknown, _options: unknown, next: (value: Snapshot) => void) => {
      backend.next = next; return backend.stop;
    });
  });
  afterEach(() => vi.clearAllMocks());

  it('keeps a joined room while the cache is empty, then loads the server room', async () => {
    const changed = vi.fn(); const stop = subscribeCoupleRoom('room-id', '12345678', changed);
    await vi.waitFor(() => expect(backend.next).toBeDefined());
    backend.next!(snapshot(false, true)); expect(changed).not.toHaveBeenCalled();
    backend.next!({ exists: () => true, metadata: { fromCache: true }, data: () => ({ partnerUid: 'partner', status: 'lobby' }) });
    backend.next!({ exists: () => true, metadata: { fromCache: false }, data: () => ({ partnerUid: 'partner', status: 'lobby' }) });
    expect(changed).not.toHaveBeenCalled();
    backend.next!(snapshot(true, false));
    expect(changed).toHaveBeenCalledWith(expect.objectContaining({ roomId: 'room-id', partnerUid: 'partner' }));
    stop(); expect(backend.stop).toHaveBeenCalledOnce();
  });

  it('clears a room only after the server confirms it is missing', async () => {
    const changed = vi.fn(); const stop = subscribeCoupleRoom('room-id', '12345678', changed);
    await vi.waitFor(() => expect(backend.next).toBeDefined());
    backend.next!(snapshot(false, false)); expect(changed).toHaveBeenCalledWith(null); stop();
  });

  it('does not open a listener if the screen closes during initialization', async () => {
    let release!: (db: object) => void;
    backend.getDb.mockReturnValueOnce(new Promise((resolve) => { release = resolve; }));
    const changed = vi.fn(); const stop = subscribeCoupleRoom('room-id', '12345678', changed);
    stop(); release({}); await Promise.resolve(); await Promise.resolve();
    expect(backend.onSnapshot).not.toHaveBeenCalled(); expect(changed).not.toHaveBeenCalled();
  });
});
