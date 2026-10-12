/** Run against the local Firestore emulator; never connects to production. */
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, getDocs, collection, setDoc, updateDoc, writeBatch, deleteDoc } from 'firebase/firestore';

if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error('Start the Firestore emulator before running this test.');
const environment = await initializeTestEnvironment({
  projectId: 'demo-double-game',
  firestore: { rules: await readFile(new URL('../firestore.rules', import.meta.url), 'utf8') },
});
const results = [];
async function check(name, action) { await action(); results.push(name); console.log('PASS', name); }
const auth = (uid) => environment.authenticatedContext(uid, {
  email: `${uid}@example.test`, firebase: { sign_in_provider: 'password' },
}).firestore();
const host = auth('host'); const partner = auth('partner'); const other = auth('other');
const now = Date.now();
const room = {
  roomId: 'qa-room', displayCode: '12345678', code: '12345678', hostUid: 'host', partnerUid: null,
  hostName: 'QA host', partnerName: null, status: 'waiting', createdAtMs: now, updatedAtMs: now,
  expiresAtMs: now + 60 * 60 * 1000, version: 0, eveningTitle: 'QA', lastEventId: null,
  updatedBy: 'host', hostReady: false, partnerReady: false, hostLastSeenMs: now, partnerLastSeenMs: 0,
};
try {
  await environment.clearFirestore();
  await environment.withSecurityRulesDisabled(async (context) => {
    for (const uid of ['host', 'partner', 'other', 'pending', 'banned']) {
      await setDoc(doc(context.firestore(), 'users', uid), {
        uid, approved: uid !== 'pending', banned: uid === 'banned', adminNote: '',
        displayName: 'QA', partnerDisplayName: 'Partner', createdAtMs: now,
        lastSeenMs: now, updatedAtMs: now, schemaVersion: 1,
      });
    }
    await setDoc(doc(context.firestore(), 'contentItems', 'qa'), { title: 'QA question' });
    await setDoc(doc(context.firestore(), 'roomCodes', '87654321'), { expiresAtMs: now - 1000, hostUid: 'host', roomId: 'expired' });
  });
  await check('approved account can look up a free room code', async () => {
    assert.equal((await assertSucceeds(getDoc(doc(host, 'roomCodes', '12345678')))).exists(), false);
  });
  for (const uid of ['pending', 'banned', 'missing']) {
    await check(`${uid} account cannot look up codes or read content`, async () => {
      await assertFails(getDoc(doc(auth(uid), 'roomCodes', '12345678')));
      await assertFails(getDoc(doc(auth(uid), 'contentItems', 'qa')));
    });
  }
  await check('anonymous account cannot look up room codes', async () => {
    const anonymous = environment.authenticatedContext('anonymous', { firebase: { sign_in_provider: 'anonymous' } }).firestore();
    await assertFails(getDoc(doc(anonymous, 'roomCodes', '12345678')));
  });
  await check('code enumeration and expired code lookup are denied', async () => {
    await assertFails(getDocs(collection(host, 'roomCodes')));
    await assertFails(getDoc(doc(host, 'roomCodes', '87654321')));
  });
  await check('approved host creates room and reserves code atomically', async () => {
    const batch = writeBatch(host);
    batch.set(doc(host, 'rooms', 'qa-room'), room);
    batch.set(doc(host, 'roomCodes', '12345678'), { roomId: 'qa-room', displayCode: '12345678', hostUid: 'host', expiresAtMs: room.expiresAtMs, createdAtMs: now });
    await assertSucceeds(batch.commit());
  });
  await check('approved partner joins waiting room', async () => {
    await assertSucceeds(getDoc(doc(partner, 'roomCodes', '12345678')));
    await assertSucceeds(getDoc(doc(partner, 'rooms', 'qa-room')));
    await assertSucceeds(updateDoc(doc(partner, 'rooms', 'qa-room'), {
      partnerUid: 'partner', partnerName: 'QA partner', partnerReady: false, partnerLastSeenMs: now,
      status: 'lobby', updatedBy: 'partner', updatedAtMs: now,
    }));
  });
  await check('members can read events while outsiders cannot read the joined room', async () => {
    await assertSucceeds(setDoc(doc(host, 'rooms', 'qa-room', 'events', 'qa-event'), { createdBy: 'host', type: 'GAME_SNAPSHOT' }));
    await assertSucceeds(getDoc(doc(partner, 'rooms', 'qa-room', 'events', 'qa-event')));
    await assertFails(getDoc(doc(other, 'rooms', 'qa-room')));
    await assertFails(getDoc(doc(other, 'rooms', 'qa-room', 'events', 'qa-event')));
  });
  await check('regular account cannot approve itself or modify public configuration', async () => {
    await assertFails(updateDoc(doc(auth('pending'), 'users', 'pending'), { approved: true }));
    await assertFails(setDoc(doc(host, 'config', 'qa-probe'), { updatedBy: 'host' }));
  });
  await check('blocked account cannot unban itself', async () => {
    await assertFails(updateDoc(doc(auth('banned'), 'users', 'banned'), { banned: false }));
  });
  await check('own profile and cloud bundle writes remain available', async () => {
    await assertSucceeds(updateDoc(doc(host, 'users', 'host'), { displayName: 'Updated QA name', updatedAtMs: now + 1 }));
    await assertSucceeds(setDoc(doc(host, 'users', 'host', 'data', 'bundle'), { schemaVersion: 2 }));
    await assertFails(setDoc(doc(other, 'users', 'host', 'data', 'bundle'), { schemaVersion: 2 }));
  });
  await check('partner leaves and host can remove its own room code and room', async () => {
    await assertSucceeds(updateDoc(doc(partner, 'rooms', 'qa-room'), {
      partnerUid: null, partnerName: null, partnerReady: false, partnerLastSeenMs: 0,
      status: 'waiting', updatedBy: 'partner', updatedAtMs: now,
    }));
    await assertSucceeds(deleteDoc(doc(host, 'roomCodes', '12345678')));
    await assertSucceeds(deleteDoc(doc(host, 'rooms', 'qa-room')));
  });
  console.log(`${results.length} Firestore rule checks passed`);
} finally { await environment.cleanup(); }
