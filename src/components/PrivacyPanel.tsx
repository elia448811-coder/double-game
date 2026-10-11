import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { clearAllLocalData } from '../utils/storage';
import {
  exportAllData,
  importAllData,
  isDiscreteMode,
  isGuestMode,
  setDiscreteMode,
  setGuestMode,
} from '../utils/privacy';
import {
  getSyncState,
  pingFirestore,
  pullUserData,
  pushUserData,
  scheduleCloudPush,
  subscribeSyncState,
  type CloudStatus,
  type SyncState,
} from '../utils/cloudSync';

type PrivacyPanelProps = { onChanged?: () => void };

const PRIVACY_KEYS = [
  'couple-spin-guest',
  'couple-spin-boundaries',
  'couple-spin-hidden-tasks',
  'couple-spin-favorites',
  'couple-spin-discrete',
];

function statusLabel(status: CloudStatus | null, checking: boolean): string {
  if (checking) return 'ענן: בודק חיבור…';
  if (!status) return 'ענן: לא נבדק';
  if (status.state === 'disabled') {
    return status.reason === 'guest' ? 'ענן: כבוי במצב אורח' : 'גיבוי בענן אינו זמין כרגע';
  }
  if (status.state === 'error') return `ענן: שגיאה — ${status.message}`;
  return 'החיבור לענן פעיל';
}

function syncLabel(state: SyncState): string {
  if (state.status === 'syncing') return 'מסנכרן עם הענן…';
  if (state.status === 'pending') return 'יש שינויים מקומיים שממתינים להעלאה';
  if (state.status === 'error') return `סנכרון נכשל: ${state.lastError ?? 'לא ידוע'}`;
  if (state.lastSyncMs) {
    return `סונכרן לאחרונה: ${new Date(state.lastSyncMs).toLocaleString('he-IL')}`;
  }
  return 'מוכן לסנכרון';
}

export function PrivacyPanel({ onChanged }: PrivacyPanelProps) {
  const importInput = useRef<HTMLInputElement>(null);
  const [guest, setGuest] = useState(isGuestMode);
  const [discrete, setDiscrete] = useState(isDiscreteMode);
  const [message, setMessage] = useState('');
  const [cloudStatus, setCloudStatus] = useState<CloudStatus | null>(null);
  const [checkingCloud, setCheckingCloud] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>(getSyncState());
  const changed = () => onChanged?.();

  useEffect(() => subscribeSyncState(setSyncState), []);

  const refreshCloud = () => {
    setCheckingCloud(true);
    void pingFirestore()
      .then(setCloudStatus)
      .finally(() => setCheckingCloud(false));
  };

  useEffect(() => {
    refreshCloud();
  }, [guest]);

  const syncNow = async (direction: 'pull' | 'push' | 'both') => {
    if (direction === 'pull' || direction === 'both') {
      const pull = await pullUserData();
      if (!pull.ok) setMessage(`משיכה מהענן נכשלה: ${pull.error ?? 'שגיאה'}`);
      else if (direction === 'pull') setMessage('הנתונים נמשכו מהענן.');
      if (pull.ok) changed();
    }
    if (direction === 'push' || direction === 'both') {
      const push = await pushUserData();
      if (!push.ok) setMessage(`העלאה לענן נכשלה: ${push.error ?? 'שגיאה'}`);
      else setMessage(direction === 'both' ? 'סנכרון דו־כיווני הושלם.' : 'הנתונים הועלו לענן.');
    }
  };

  const downloadExport = () => {
    const blob = new Blob([JSON.stringify(exportAllData(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'couple-spin-data.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const importFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    void file.text().then((text) => {
      try {
        const result = importAllData(JSON.parse(text));
        setMessage(result.ok ? 'המידע יובא בהצלחה.' : `הייבוא נכשל: ${result.error ?? 'קובץ לא תקין'}`);
        if (result.ok) {
          changed();
          scheduleCloudPush();
        }
      } catch {
        setMessage('הקובץ אינו JSON תקין.');
      }
    });
    event.target.value = '';
  };

  const clearHistory = () => {
    if (!window.confirm('למחוק את ההיסטוריה מהמכשיר?')) return;
    localStorage.removeItem('couple-spin-history');
    setMessage('ההיסטוריה נמחקה.');
    scheduleCloudPush();
    changed();
  };

  const clearCustom = () => {
    if (!window.confirm('למחוק את כל השאלות והמשימות שהוספתם?')) return;
    localStorage.removeItem('couple-spin-custom-content');
    setMessage('התוכן המותאם נמחק.');
    scheduleCloudPush();
    changed();
  };

  const clearEverything = () => {
    if (!window.confirm('למחוק את כל המידע המקומי מהמכשיר?')) return;
    clearAllLocalData();
    PRIVACY_KEYS.forEach((key) => localStorage.removeItem(key));
    setGuest(false);
    setDiscrete(false);
    setMessage('כל המידע המקומי נמחק.');
    scheduleCloudPush();
    changed();
  };

  return (
    <section className="privacy-panel settings-panel" dir="rtl" aria-labelledby="privacy-title">
      <h2 id="privacy-title" className="flow-title">פרטיות ומידע</h2>
      <p className="flow-desc">
        הנתונים נשמרים במכשיר. כשמחוברים לחשבון, אפשר לגבות ולסנכרן אותם עם הענן. במצב אורח הסנכרון כבוי.
      </p>
      <p className="history-hint" role="status" aria-live="polite">
        {statusLabel(cloudStatus, checkingCloud)}
      </p>
      <p className="history-hint" aria-live="polite">{syncLabel(syncState)}</p>
      <div className="settings-actions">
        <button type="button" className="flow-link pressable" onClick={refreshCloud} disabled={checkingCloud}>
          בדוק חיבור ענן
        </button>
        <button type="button" className="flow-link pressable" onClick={() => void syncNow('both')}>
          מזג בין מכשיר לענן
        </button>
        <button type="button" className="flow-link pressable" onClick={() => void syncNow('pull')}>
          הורד גרסה מהענן
        </button>
        <button type="button" className="flow-link pressable" onClick={() => void syncNow('push')}>
          שמור מכשיר לענן
        </button>
      </div>
      <label className="settings-toggle">
        <span>מצב אורח — לא לשמור פרטים חדשים</span>
        <input
          type="checkbox"
          checked={guest}
          onChange={(event) => {
            setGuest(event.target.checked);
            setGuestMode(event.target.checked);
            changed();
          }}
        />
        <span className="settings-toggle__slider" />
      </label>
      <label className="settings-toggle">
        <span>מצב דיסקרטי</span>
        <input
          type="checkbox"
          checked={discrete}
          onChange={(event) => {
            setDiscrete(event.target.checked);
            setDiscreteMode(event.target.checked);
            changed();
          }}
        />
        <span className="settings-toggle__slider" />
      </label>
      <div className="settings-actions">
        <button type="button" className="flow-link pressable" onClick={downloadExport}>
          ייצוא נתונים
        </button>
        <button type="button" className="flow-link pressable" onClick={() => importInput.current?.click()}>
          ייבוא נתונים
        </button>
        <input ref={importInput} type="file" accept="application/json,.json" onChange={importFile} hidden aria-label="קובץ נתונים לייבוא" />
        <button type="button" className="flow-link pressable" onClick={clearHistory}>
          מחיקת היסטוריה בלבד
        </button>
        <button type="button" className="flow-link pressable" onClick={clearCustom}>
          מחיקת תוכן מותאם בלבד
        </button>
        <button type="button" className="flow-link pressable" onClick={clearEverything}>
          מחיקת כל המידע המקומי
        </button>
      </div>
      {message && <p role="status">{message}</p>}
    </section>
  );
}
