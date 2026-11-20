// Select the Firebase account before mounting any screen that reads persisted game data.
let activeUid: string | null = null;
let generation = 0;

export function currentAccount() { return activeUid; }
export function accountGeneration() { return generation; }

export function selectAccount(uid: string | null): void {
  if (uid === activeUid) return;
  activeUid = uid;
  generation++;
  if (!uid) return;
  try {
    // The old profile identifies its own owner. Other legacy keys have no owner
    // information and may have been shared, so retain them untouched and use the UID's cloud data.
    const profileKey = 'couple-spin-user-profile';
    const raw = localStorage.getItem(profileKey);
    if (raw && JSON.parse(raw)?.uid === uid && accountLocal.getItem(profileKey) === null) {
      accountLocal.setItem(profileKey, raw);
    }
  } catch { /* Cloud data is still available when browser storage is blocked. */ }
}

function accountKey(key: string) {
  if (!activeUid && (import.meta.env.MODE === 'test' || (import.meta.env.DEV && import.meta.env.VITE_PREVIEW_MODE === 'true'))) return key;
  return 'account:' + (activeUid ? encodeURIComponent(activeUid) : '~signed-out') + ':' + key;
}

function scopedStorage(storage: () => Storage) {
  return {
    getItem: (key: string) => storage().getItem(accountKey(key)),
    setItem: (key: string, value: string) => storage().setItem(accountKey(key), value),
    removeItem: (key: string) => storage().removeItem(accountKey(key)),
  };
}

export const accountLocal = scopedStorage(() => localStorage);
export const accountSession = scopedStorage(() => sessionStorage);
