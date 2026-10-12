import { useEffect, useState } from 'react';
import { CustomContentPanel } from './CustomContentPanel';
import { PrivacyPanel } from './PrivacyPanel';
import { UserAccountPanel } from './UserAccountPanel';
import { RadioGroup } from './RadioGroup';
import { SectionTabs } from './SectionTabs';
import { clearAllLocalData, loadHistory, loadRecords, loadUnlockedAchievements } from '../utils/storage';
import { getFeatureFlags, setFeatureFlag } from '../utils/featureFlags';
import { isCurrentUserAdmin } from '../utils/admin';
import { clearContentMemory } from '../utils/contentMemory';
import { signOutUser } from '../utils/userAuth';
import { ACHIEVEMENTS, AVATAR_OPTIONS, PLAYER_COLORS } from '../types/game';
import type { AnimationStyle, AppSettings, BgTheme, FontChoice, SoundPack, SpinnerStyle } from '../types/game';

type SettingsPanelProps = {
  settings: AppSettings;
  onUpdate: (partial: Partial<AppSettings>) => void;
  onResetScores: () => void;
  onBack: () => void;
  onOpenAdmin?: () => void;
  buildVersion?: string;
};

const SPINNER_STYLES: { value: SpinnerStyle; label: string }[] = [
  { value: 'classic', label: 'קלאסי' },
  { value: 'glass', label: 'זכוכית' },
  { value: 'heart', label: 'לב' },
];

const FONTS: { value: FontChoice; label: string }[] = [
  { value: 'heebo', label: 'Heebo' },
  { value: 'assistant', label: 'Assistant' },
  { value: 'rubik', label: 'Rubik' },
];

const BG_THEMES: { value: BgTheme; label: string }[] = [
  { value: 'default', label: 'ברירת מחדל' },
  { value: 'purple', label: 'סגול' },
  { value: 'rose', label: 'ורוד' },
  { value: 'ocean', label: 'אוקיינוס' },
];

const SOUND_PACKS: { value: SoundPack; label: string }[] = [
  { value: 'default', label: 'רגיל' },
  { value: 'soft', label: 'רך' },
  { value: 'playful', label: 'שמח' },
];

const SECTIONS = [
  { value: 'display', label: 'תצוגה וצליל' },
  { value: 'players', label: 'שחקנים' },
  { value: 'content', label: 'תוכן ומשחק' },
  { value: 'account', label: 'חשבון ופרטיות' },
  { value: 'records', label: 'היסטוריה' },
] as const;
type SettingsSection = typeof SECTIONS[number]['value'];

export function SettingsPanel({
  settings,
  onUpdate,
  onResetScores,
  onBack,
  onOpenAdmin,
  buildVersion,
}: SettingsPanelProps) {
  const [dataRevision, setDataRevision] = useState(0);
  const [section, setSection] = useState<SettingsSection>('display');
  const records = loadRecords();
  const history = loadHistory();
  const achievements = loadUnlockedAchievements();
  const [contentNotice, setContentNotice] = useState('');
  const [cleared, setCleared] = useState(false);
  const [flags, setFlags] = useState(getFeatureFlags);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    void isCurrentUserAdmin().then(setIsAdmin);
  }, []);

  const toggleFlag = (key: 'enablePartnerControl' | 'enableSurpriseMode') => {
    const next = !flags[key];
    setFeatureFlag(key, next);
    setFlags({ ...flags, [key]: next });
  };

  return (
    <div className="settings-panel">
      <SectionTabs id="settings" label="נושאי ההגדרות" value={section} options={[...SECTIONS]} onChange={setSection} />
      <section className="settings-tabpanel" id="settings-panel-display" role="tabpanel" aria-labelledby="settings-tab-display" hidden={section !== 'display'} tabIndex={0}>
        <div className="settings-group">
          <label className="settings-toggle">
            <span>הפעלת סאונד</span>
            <input type="checkbox" checked={settings.soundEnabled} onChange={(e) => onUpdate({ soundEnabled: e.target.checked })} />
            <span className="settings-toggle__slider" />
          </label>
          <label className="settings-toggle">
            <span>מוזיקת רקע</span>
            <input type="checkbox" checked={settings.backgroundMusicEnabled} onChange={(e) => onUpdate({ backgroundMusicEnabled: e.target.checked })} />
            <span className="settings-toggle__slider" />
          </label>
          <label className="settings-toggle">
            <span>רטט במובייל</span>
            <input type="checkbox" checked={settings.vibrationEnabled} onChange={(e) => onUpdate({ vibrationEnabled: e.target.checked })} />
            <span className="settings-toggle__slider" />
          </label>
          <label className="settings-toggle">
            <span>תצוגה רגועה</span>
            <input type="checkbox" checked={settings.calmDisplay} onChange={(e) => onUpdate({ calmDisplay: e.target.checked })} />
            <span className="settings-toggle__slider" />
          </label>
          <p className="custom-content-panel__hint">מסתירה את הרובוט ואת אפקטי הרקע, ומצמצמת תנועה בזמן המשחק.</p>
          <label className="settings-toggle">
            <span>מצב כהה</span>
            <input type="checkbox" checked={settings.theme === 'dark'} onChange={(e) => onUpdate({ theme: e.target.checked ? 'dark' : 'light' })} />
            <span className="settings-toggle__slider" />
          </label>
          <label className="settings-toggle">
            <span>מצב עיוורי צבעים</span>
            <input type="checkbox" checked={settings.colorblindMode} onChange={(e) => onUpdate({ colorblindMode: e.target.checked })} />
            <span className="settings-toggle__slider" />
          </label>
          <label className="settings-toggle">
            <span>משימות מתקדמות</span>
            <input type="checkbox" checked={settings.advancedTasksEnabled} onChange={(e) => onUpdate({ advancedTasksEnabled: e.target.checked })} />
            <span className="settings-toggle__slider" />
          </label>
        </div>

        <div className="settings-group">
          <RadioGroup label="חבילת סאונד" value={settings.soundPack} options={SOUND_PACKS}
            onChange={(soundPack) => onUpdate({ soundPack })} />
        </div>

        <div className="settings-group">
          <RadioGroup
            label="עיצוב ספינר"
            value={settings.spinnerStyle}
            options={SPINNER_STYLES}
            onChange={(spinnerStyle) => onUpdate({ spinnerStyle })}
          />
          <RadioGroup
            label="פונט"
            value={settings.fontChoice}
            options={FONTS}
            onChange={(fontChoice) => onUpdate({ fontChoice })}
          />
          <RadioGroup
            label="רקע"
            value={settings.bgTheme}
            options={BG_THEMES}
            onChange={(bgTheme) => onUpdate({ bgTheme })}
          />
          <RadioGroup
            label="אנימציות"
            value={settings.animationStyle}
            options={([
              { value: 'full' as AnimationStyle, label: 'מלא' },
              { value: 'reduced' as AnimationStyle, label: 'מופחת' },
            ])}
            onChange={(animationStyle) => onUpdate({ animationStyle })}
          />
        </div>

      </section>
      <section className="settings-tabpanel" id="settings-panel-players" role="tabpanel" aria-labelledby="settings-tab-players" hidden={section !== 'players'} tabIndex={0}>
        <div className="settings-player-grid">
          {([1, 2] as const).map((player) => {
            const first = player === 1;
            return (
              <section className="settings-group" key={player}>
                <label className="settings-field">
                  <span>שחקן {player}</span>
                  <input type="text" maxLength={30} value={first ? settings.playerOneName : settings.playerTwoName}
                    onChange={(event) => onUpdate(first ? { playerOneName: event.target.value } : { playerTwoName: event.target.value })} />
                </label>
                <RadioGroup className="settings-avatar-options" label={`אווטאר שחקן ${player}`}
                  value={first ? settings.playerOneAvatar : settings.playerTwoAvatar}
                  options={AVATAR_OPTIONS.map((avatar) => ({ value: avatar, label: avatar }))}
                  onChange={(avatar) => onUpdate(first ? { playerOneAvatar: avatar } : { playerTwoAvatar: avatar })} />
                <RadioGroup className="settings-color-options" label={`צבע שחקן ${player}`}
                  value={first ? settings.playerOneColor : settings.playerTwoColor}
                  options={PLAYER_COLORS.map((color) => ({ value: color.value, label: color.label, swatch: color.value }))}
                  onChange={(color) => onUpdate(first ? { playerOneColor: color } : { playerTwoColor: color })} />
              </section>
            );
          })}
        </div>
      </section>
      <section className="settings-tabpanel" id="settings-panel-content" role="tabpanel" aria-labelledby="settings-tab-content" hidden={section !== 'content'} tabIndex={0}>
        <div className="settings-group">
          <h2 className="settings-label">התוכן שמתאים לכם</h2>
          <label className="settings-toggle"><span>התאמה לפי הדירוגים שלכם</span>
            <input type="checkbox" checked={settings.personalizeContent} onChange={(e) => onUpdate({ personalizeContent: e.target.checked })} />
            <span className="settings-toggle__slider" />
          </label>
          <label className="settings-toggle"><span>העדפת שאלות ומשימות חדשות</span>
            <input type="checkbox" checked={settings.preferUnseenContent} onChange={(e) => onUpdate({ preferUnseenContent: e.target.checked })} />
            <span className="settings-toggle__slider" />
          </label>
          <p className="custom-content-panel__hint">הדירוגים עוזרים לבחור תוכן דומה שאהבתם. זיכרון הפריטים שהופיעו נשמר במכשיר ל־90 יום, ללא התשובות שלכם. במועדפים אפשר לחזור בכוונה לתוכן ששמרתם.</p>
          <button type="button" className="secondary-action pressable" onClick={() => {
            if (!window.confirm('לשכוח אילו שאלות ומשימות כבר הופיעו במכשיר? המועדפים והדירוגים יישמרו.')) return;
            clearContentMemory(); setContentNotice('זיכרון השאלות והמשימות אופס.');
          }}>איפוס זיכרון השאלות והמשימות</button>
          {contentNotice && <p role="status">{contentNotice}</p>}
        </div>
        <div className="settings-group">
          <span className="settings-label">חיבור זוגי (ניסיוני)</span>
          <label className="settings-toggle">
            <span>שליטה משותפת לשותף/ה</span>
            <input
              type="checkbox"
              checked={flags.enablePartnerControl}
              onChange={() => toggleFlag('enablePartnerControl')}
            />
            <span className="settings-toggle__slider" />
          </label>
          <p className="custom-content-panel__hint">
            כבוי (מומלץ): השותף/ה צופה בזמן אמת בלבד. דלוק: ממשק שליטה מקומי לשותף/ה — סנכרון המשחק נשאר אצל המארח/ת מטעמי אבטחה.
          </p>
          <label className="settings-toggle">
            <span>ערב הפתעה</span>
            <input
              type="checkbox"
              checked={flags.enableSurpriseMode}
              onChange={() => toggleFlag('enableSurpriseMode')}
            />
            <span className="settings-toggle__slider" />
          </label>
        </div>

        <CustomContentPanel matureAgeConfirmed={settings.matureAgeConfirmed} dataRevision={dataRevision} />
      </section>
      <section className="settings-tabpanel" id="settings-panel-account" role="tabpanel" aria-labelledby="settings-tab-account" hidden={section !== 'account'} tabIndex={0}>
        <UserAccountPanel />

        {isAdmin && onOpenAdmin && (
          <section className="settings-group" style={{ outline: '2px solid var(--accent, #e85d8a)', borderRadius: 16, padding: 12 }}>
            <h2 className="settings-label">ניהול מערכת</h2>
            <p className="custom-content-panel__hint">
              מחוברים כאדמין — כאן עורכים שאלות, עמוד כניסה והרשמה.
            </p>
            <button type="button" className="primary-action pressable" onClick={onOpenAdmin}>
              פתיחת לוח ניהול
            </button>
          </section>
        )}

        <PrivacyPanel onChanged={() => setDataRevision((revision) => revision + 1)} />

        <div className="settings-group">
          <span className="settings-label">פרטיות</span>
          <p className="custom-content-panel__hint">
            כאן אפשר למחוק נתונים שנשמרו במכשיר. סנכרון לענן וחיבור זוגי מנוהלים בנפרד בהגדרות החשבון והפרטיות.
          </p>
          <button
            type="button"
            className="secondary-action pressable"
            onClick={() => {
              if (!window.confirm('למחוק את כל הנתונים המקומיים מהמכשיר?')) return;
              clearAllLocalData();
              setCleared(true);
              window.setTimeout(() => window.location.reload(), 400);
            }}
          >
            מחיקת כל הנתונים
          </button>
          {cleared && <p className="history-hint">הנתונים נמחקו — מרענן...</p>}
        </div>

        <div className="settings-group">
          <span className="settings-label">מידע על האפליקציה</span>
          <p className="history-hint">{buildVersion ?? 'dev'}</p>
          <button
            type="button"
            className="secondary-action pressable"
            onClick={() => {
              void signOutUser().then(() => window.location.reload());
            }}
          >
            התנתקות מהחשבון
          </button>
        </div>

      </section>
      <section className="settings-tabpanel" id="settings-panel-records" role="tabpanel" aria-labelledby="settings-tab-records" hidden={section !== 'records'} tabIndex={0}>
        <div className="settings-group records-box">
          <span className="settings-label">שיאים מקומיים</span>
          <div className="stats-grid">
            <div className="stat-box"><strong>{records.totalGames}</strong><span>משחקים</span></div>
            <div className="stat-box"><strong>{records.mostCompleted}</strong><span>שיא</span></div>
            <div className="stat-box"><strong>{records.longestStreak}</strong><span>רצף</span></div>
          </div>
          {history.length > 0 && <p className="history-hint">אחרון: {new Date(history[0].date).toLocaleDateString('he-IL')}</p>}
          <div className="achievements-row">
            {ACHIEVEMENTS.filter((a) => achievements.includes(a.id)).map((a) => (
              <span key={a.id} className="achievement-badge">{a.emoji} {a.title}</span>
            ))}
          </div>
        </div>

      </section>
      <div className="modal-actions settings-actions">
        <button type="button" className="secondary-action pressable" onClick={onResetScores}>איפוס ניקוד</button>
        <button type="button" className="primary-action pressable" onClick={onBack}>חזרה למסך הראשי</button>
      </div>
    </div>
  );
}
