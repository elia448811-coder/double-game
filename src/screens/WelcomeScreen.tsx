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
        <div className="welcome-hero__badge">Couple Spin · ערב זוגי</div>
        <h1 className="welcome-hero__title">ספין זוגי</h1>
        <p className="welcome-hero__tag">
          מסובבים את הגלגל · מקבלים משימה או שאלה · צוחקים יחד
        </p>

        <div className="welcome-hero__steps">
          <span>🎲 קובייה — מי מתחיל?</span>
          <span>🎡 גלגל — מה עושים עכשיו?</span>
          <span>💜 כיף — תמיד אפשר לדלג</span>
        </div>

        <p className="welcome-hero__robot-hint">
          <span>🤖</span>
          <span>
            פגשו את <strong>ספינבי</strong> — השופט הכי נחמד (לחצו על הרובוט בפינה)
          </span>
        </p>

        <button type="button" className="cta-button cta-button--hero pressable" onClick={onStart}>
          🎡 בואו נשחק!
        </button>

        <button type="button" className="flow-link pressable" onClick={onSettings}>
          ⚙️ הגדרות
        </button>

        <p className="welcome-hero__note">
          {total} משימות ושאלות · אתגר 100 שאלות · מצב 18+ · בטוח ונוח לדלג
        </p>
      </div>
    </section>
  );
}
