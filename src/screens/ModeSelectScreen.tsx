import { ModeCard } from '../components/ModeCard';
import type { GameMode } from '../types/game';

const MODES: GameMode[] = ['funny', 'romantic', 'challenge', 'calm', 'mixed'];

type ModeSelectScreenProps = {
  selected: GameMode;
  onSelect: (mode: GameMode) => void;
  onContinue: () => void;
  onBack: () => void;
};

export function ModeSelectScreen({
  selected,
  onSelect,
  onContinue,
  onBack,
}: ModeSelectScreenProps) {
  return (
    <section className="page-screen mode-select-screen">
      <div className="game-card">
        <button type="button" className="back-btn" onClick={onBack} aria-label="חזרה">
          →
        </button>

        <header className="top-bar compact-top">
          <div>
            <p className="eyebrow">Couple Spin</p>
            <h1 className="page-heading">בחרו מצב משחק</h1>
          </div>
        </header>

        <div className="mode-grid mode-grid--select">
          {MODES.map((mode) => (
            <ModeCard
              key={mode}
              mode={mode}
              selected={selected === mode}
              onSelect={onSelect}
            />
          ))}
        </div>

        <button
          type="button"
          className="spin-button"
          onClick={onContinue}
          aria-label="המשך לבחירת רמה"
        >
          המשך
        </button>
      </div>
    </section>
  );
}
