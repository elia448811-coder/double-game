import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appendRoomEvent } from './coupleRoom';

const backend = vi.hoisted(() => ({ runTransaction: vi.fn(), getDocFromServer: vi.fn() }));
vi.mock('../lib/firebase', () => ({
  isFirebaseConfigured: () => true, getFirestoreDb: async () => ({}),
  getFirebaseAuth: async () => ({ currentUser: { uid: 'host', email: 'qa@example.test' } }),
}));
vi.mock('firebase/firestore', () => ({
  doc: () => ({}), serverTimestamp: () => 'timestamp',
  runTransaction: backend.runTransaction, getDocFromServer: backend.getDocFromServer,
}));
const room = (version: number, hostUid = 'host') => ({
  exists: () => true, data: () => ({ hostUid, partnerUid: 'partner', version, expiresAtMs: Date.now() + 60000, status: 'lobby' }),
});
const denial = () => Object.assign(new Error('Missing or insufficient permissions.'), { code: 'permission-denied' });
type Transaction = { get: () => Promise<ReturnType<typeof room>>; set: () => void; update: () => void };

describe('room event version conflicts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    backend.runTransaction.mockImplementation(async (_db: unknown, body: (tx: Transaction) => Promise<number>) =>
      body({ get: async () => room(1), set: () => {}, update: () => {} }));
    backend.runTransaction.mockImplementationOnce(async (_db: unknown, body: (tx: Transaction) => Promise<number>) => {
      await body({ get: async () => room(0), set: () => {}, update: () => {} }); throw denial();
    });
    backend.getDocFromServer.mockResolvedValue(room(1));
  });
  it('retries a verified concurrent version change and writes the next version', async () => {
    expect(await appendRoomEvent('qa-room', 'PLAYER_READY')).toEqual({ ok: true, version: 2 });
    expect(backend.runTransaction).toHaveBeenCalledTimes(2);
  });
  it('preserves a permission denial when the room version did not change', async () => {
    backend.getDocFromServer.mockResolvedValue(room(0));
    expect((await appendRoomEvent('qa-room', 'PLAYER_READY')).ok).toBe(false);
    expect(backend.runTransaction).toHaveBeenCalledOnce();
  });
  it('does not retry after the caller loses room membership', async () => {
    backend.getDocFromServer.mockResolvedValue(room(1, 'other-host'));
    expect((await appendRoomEvent('qa-room', 'PLAYER_READY')).ok).toBe(false);
    expect(backend.runTransaction).toHaveBeenCalledOnce();
  });
});
