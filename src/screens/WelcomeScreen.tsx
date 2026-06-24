import { getFullBankStats } from '../utils/taskSelection';

type WelcomeScreenProps = {
  onStart: () => void;
  onSettings: () => void;
};

export function WelcomeScreen({ onStart, onSettings }: WelcomeScreenProps) {
  const bank = getFullBankStats('mixed');

  return (
    <section className="page-screen welcome-screen">
      <div className="game-card welcome-card animate-in">
        <header className="top-bar welcome-top">
          <div>
            <p className="eyebrow">Couple Spin</p>
            <h1>ספין זוגי</h1>
            <p className="subtitle">משחק משימות מצחיק וכיפי לזוגות</p>
          </div>
        </header>

        <p className="welcome-tagline">מסובבים, מקבלים משימה, וצוחקים יחד</p>
        <p className="welcome-bank">
          🎯 {bank.tasks} משימות + {bank.questions} שאלות = {bank.total} תוכן זוגי נקי!
        </p>

        <div className="welcome-actions">
          <button type="button" className="spin-button welcome-start-btn pressable" onClick={onStart}>
            התחילו לשחק
          </button>
          <button type="button" className="ghost-action welcome-settings-btn pressable" onClick={onSettings}>
            הגדרות
          </button>
        </div>

        <p className="welcome-footer">
          כל משימה ניתנת לדילוג. משחקים רק במה שנעים לשניכם.
        </p>
      </div>
    </section>
  );
}
