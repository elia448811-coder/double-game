import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { accountLocal, accountSession, selectAccount } from './accountStorage';

function memoryStorage() {
  const items = new Map<string, string>();
  return {
    get length() { return items.size; },
    key: (index: number) => [...items.keys()][index] ?? null,
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => items.set(key, value),
    removeItem: (key: string) => items.delete(key),
  };
}
beforeEach(() => {
  vi.stubGlobal('localStorage', memoryStorage());
  vi.stubGlobal('sessionStorage', memoryStorage());
});
afterEach(() => { selectAccount(null); vi.unstubAllGlobals(); });

it('separates two accounts and restores their own history, session and pending sync after switching', () => {
  selectAccount('first');
  accountLocal.setItem('couple-spin-history', 'first history');
  accountLocal.setItem('couple-spin-cloud-outbox', '1');
  accountSession.setItem('couple-spin-active-game', 'first game');
  selectAccount('second');
  expect(accountLocal.getItem('couple-spin-history')).toBeNull();
  expect(accountLocal.getItem('couple-spin-cloud-outbox')).toBeNull();
  expect(accountSession.getItem('couple-spin-active-game')).toBeNull();
  accountLocal.setItem('couple-spin-history', 'second history');
  selectAccount('first');
  expect(accountLocal.getItem('couple-spin-history')).toBe('first history');
  expect(accountSession.getItem('couple-spin-active-game')).toBe('first game');
});

it('retains unattributed legacy history without exposing or uploading it for either account', () => {
  const profile = JSON.stringify({ uid: 'profile-owner' });
  localStorage.setItem('couple-spin-user-profile', profile);
  localStorage.setItem('couple-spin-history', 'unattributed history');
  selectAccount('other');
  expect(accountLocal.getItem('couple-spin-history')).toBeNull();
  expect(accountLocal.getItem('couple-spin-user-profile')).toBeNull();
  selectAccount('profile-owner');
  expect(accountLocal.getItem('couple-spin-history')).toBeNull();
  expect(accountLocal.getItem('couple-spin-user-profile')).toBe(profile);
  expect(localStorage.getItem('couple-spin-history')).toBe('unattributed history');
});
