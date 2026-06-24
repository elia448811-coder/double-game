import { getContentBankStats } from '../data/allContent';

type WelcomeScreenProps = {
  onStart: () => void;
  onSettings: () => void;
};

export function WelcomeScreen({ onStart, onSettings }: WelcomeScreenProps) {
  const { total } = getContentBankStats();

  return (
    <section className="page-screen flow-screen welcome-screen">
      <div className="welcome-hero flow-card animate-in">
        <div className="welcome-hero__glow" aria-hidden />
        <div className="welcome-hero__badge">Couple Spin</div>
        <h1 className="welcome-hero__title">ספין זוגי</h1>
        <p className="welcome-hero__tag">מסובבים · מקבלים משימה · צוחקים יחד</p>

        <div className="welcome-hero__steps">
          <span>🎲 מגלגלים מי מתחיל</span>
          <span>🎡 מסובבים את הגלגל</span>
          <span>💜 נהנים יחד</span>
        </div>

        <button type="button" className="cta-button cta-button--hero pressable" onClick={onStart}>
          🎡 בואו נשחק
        </button>

        <button type="button" className="flow-link pressable" onClick={onSettings}>
          ⚙️ הגדרות
        </button>

        <p className="welcome-hero__note">{total} משימות ושאלות · כולל מצב 18+ · תמיד אפשר לדלג</p>
      </div>
    </section>
  );
}
