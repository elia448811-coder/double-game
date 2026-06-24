type WelcomeScreenProps = {
  onStart: () => void;
  onSettings: () => void;
};

export function WelcomeScreen({ onStart, onSettings }: WelcomeScreenProps) {
  return (
    <section className="page-screen welcome-screen">
      <div className="welcome-hero animate-in">
        <div className="welcome-hero__badge">Couple Spin</div>
        <h1 className="welcome-hero__title">ספין זוגי</h1>
        <p className="welcome-hero__tag">מסובבים · מקבלים משימה · צוחקים יחד</p>

        <button type="button" className="cta-button cta-button--hero pressable" onClick={onStart}>
          🎡 בואו נשחק
        </button>

        <button type="button" className="welcome-hero__settings pressable" onClick={onSettings}>
          ⚙️ הגדרות
        </button>

        <p className="welcome-hero__note">450 משימות ושאלות · תמיד אפשר לדלג</p>
      </div>
    </section>
  );
}
