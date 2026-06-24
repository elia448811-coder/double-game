type TutorialScreenProps = {
  onStart: () => void;
  onBack: () => void;
};

const STEPS = [
  { emoji: '🎡', title: 'סובבו את הגלגל', text: 'לחצו על "סובב" וקבלו קטגוריה אקראית.' },
  { emoji: '💪', title: 'בצעו או דברו', text: 'משימה? בצעו. שאלה? שתפו בכנות. תמיד אפשר לדלג!' },
  { emoji: '🏆', title: 'צברו נקודות', text: 'כל משימה שבוצעה = נקודה. מי מגיע ליעד — מנצח!' },
];

export function TutorialScreen({ onStart, onBack }: TutorialScreenProps) {
  return (
    <section className="page-screen tutorial-screen">
      <div className="game-card">
        <button type="button" className="back-btn" onClick={onBack} aria-label="חזרה">
          →
        </button>

        <header className="top-bar compact-top">
          <div>
            <p className="eyebrow">Couple Spin</p>
            <h1 className="page-heading">איך משחקים?</h1>
            <p className="subtitle">הסבר קצר לפני שמתחילים</p>
          </div>
        </header>

        <div className="tutorial-steps">
          {STEPS.map((step, i) => (
            <div key={step.title} className="tutorial-step">
              <span className="tutorial-step__num">{i + 1}</span>
              <span className="tutorial-step__emoji">{step.emoji}</span>
              <div>
                <strong>{step.title}</strong>
                <p>{step.text}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="level-warning">אין חובה — משימות ושאלות, תמיד אפשר לדלג!</p>

        <button type="button" className="spin-button pressable" onClick={onStart}>
          הבנו — בואו נשחק!
        </button>
      </div>
    </section>
  );
}
