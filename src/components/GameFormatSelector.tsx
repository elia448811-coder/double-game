import type { GameFormat, ScoringMode } from '../types/game';
import { GAME_FORMAT_DESCRIPTIONS, GAME_FORMAT_LABELS, SCORING_MODE_LABELS } from '../types/game';

type GameFormatSelectorProps = {
  format: GameFormat;
  scoringMode: ScoringMode;
  coupleTaskMode: boolean;
  roundCount: number;
  onFormatChange: (f: GameFormat) => void;
  onScoringChange: (m: ScoringMode) => void;
  onCoupleModeChange: (v: boolean) => void;
  onRoundCountChange: (n: number) => void;
};

const FORMATS: GameFormat[] = ['quick', 'normal', 'full', 'rounds', 'fun'];
const ROUNDS = [8, 12, 16, 20];

export function GameFormatSelector({
  format,
  scoringMode,
  coupleTaskMode,
  roundCount,
  onFormatChange,
  onScoringChange,
  onCoupleModeChange,
  onRoundCountChange,
}: GameFormatSelectorProps) {
  return (
    <div className="format-selector">
      <span className="settings-label">פורמט משחק</span>
      <div className="format-grid">
        {FORMATS.map((f) => (
          <button
            key={f}
            type="button"
            className={`format-card ${format === f ? 'selected' : ''}`}
            onClick={() => onFormatChange(f)}
          >
            <strong>{GAME_FORMAT_LABELS[f]}</strong>
            <p>{GAME_FORMAT_DESCRIPTIONS[f]}</p>
          </button>
        ))}
      </div>

      {format !== 'fun' && (
        <div className="scoring-row">
          <span className="settings-label">סוג ניקוד</span>
          <div className="target-score-options">
            {(['competitive', 'cooperative', 'none'] as ScoringMode[]).map((m) => (
              <button
                key={m}
                type="button"
                className={`target-score-btn ${scoringMode === m ? 'target-score-btn--selected' : ''}`}
                onClick={() => onScoringChange(m)}
              >
                {SCORING_MODE_LABELS[m]}
              </button>
            ))}
          </div>
        </div>
      )}

      {format === 'rounds' && (
        <div className="rounds-row">
          <span className="settings-label">מספר סיבובים</span>
          <div className="target-score-options">
            {ROUNDS.map((n) => (
              <button
                key={n}
                type="button"
                className={`target-score-btn ${roundCount === n ? 'target-score-btn--selected' : ''}`}
                onClick={() => onRoundCountChange(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      <label className="settings-toggle couple-toggle">
        <span>💑 מצב משימה זוגית — שניכם מבצעים יחד</span>
        <input
          type="checkbox"
          checked={coupleTaskMode}
          onChange={(e) => onCoupleModeChange(e.target.checked)}
        />
        <span className="settings-toggle__slider" />
      </label>
    </div>
  );
}
