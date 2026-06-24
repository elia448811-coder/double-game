import { ContentModeSelector } from '../components/ContentModeSelector';
import { GameFormatSelector } from '../components/GameFormatSelector';
import { LevelSelector } from '../components/LevelSelector';
import { AVATAR_OPTIONS, PLAYER_COLORS } from '../types/game';
import type { ContentMode, GameFormat, ScoringMode, TargetScore, TaskLevel } from '../types/game';

type LevelSelectScreenProps = {
  level: TaskLevel;
  gameFormat: GameFormat;
  scoringMode: ScoringMode;
  coupleTaskMode: boolean;
  contentMode: ContentMode;
  roundCount: number;
  targetScore: TargetScore;
  customTargetScore: number;
  eveningName: string;
  playerOneName: string;
  playerTwoName: string;
  playerOneColor: string;
  playerTwoColor: string;
  playerOneAvatar: string;
  playerTwoAvatar: string;
  onLevelSelect: (level: TaskLevel) => void;
  onFormatChange: (f: GameFormat) => void;
  onScoringChange: (m: ScoringMode) => void;
  onCoupleModeChange: (v: boolean) => void;
  onContentModeChange: (m: ContentMode) => void;
  onRoundCountChange: (n: number) => void;
  onTargetScoreSelect: (score: TargetScore) => void;
  onCustomTargetChange: (n: number) => void;
  onEveningNameChange: (name: string) => void;
  onPlayerNamesChange: (p1: string, p2: string) => void;
  onPlayerColorsChange: (c1: string, c2: string) => void;
  onPlayerAvatarsChange: (a1: string, a2: string) => void;
  onContinue: () => void;
  onBack: () => void;
};

const TARGET_OPTIONS: { value: TargetScore; label: string }[] = [
  { value: 5, label: '5' },
  { value: 10, label: '10' },
  { value: 15, label: '15' },
  { value: 'custom', label: 'מותאם' },
  { value: 'free', label: 'חופשי' },
];

export function LevelSelectScreen({
  level,
  gameFormat,
  scoringMode,
  coupleTaskMode,
  contentMode,
  roundCount,
  targetScore,
  customTargetScore,
  eveningName,
  playerOneName,
  playerTwoName,
  playerOneColor,
  playerTwoColor,
  playerOneAvatar,
  playerTwoAvatar,
  onLevelSelect,
  onFormatChange,
  onScoringChange,
  onCoupleModeChange,
  onContentModeChange,
  onRoundCountChange,
  onTargetScoreSelect,
  onCustomTargetChange,
  onEveningNameChange,
  onPlayerNamesChange,
  onPlayerColorsChange,
  onPlayerAvatarsChange,
  onContinue,
  onBack,
}: LevelSelectScreenProps) {
  return (
    <section className="page-screen level-select-screen">
      <div className="game-card">
        <button type="button" className="back-btn" onClick={onBack} aria-label="חזרה">
          →
        </button>

        <header className="top-bar compact-top">
          <div>
            <p className="eyebrow">Couple Spin</p>
            <h1 className="page-heading">הגדרות משחק</h1>
          </div>
        </header>

        <ContentModeSelector contentMode={contentMode} onChange={onContentModeChange} />

        <GameFormatSelector
          format={gameFormat}
          scoringMode={scoringMode}
          coupleTaskMode={coupleTaskMode}
          roundCount={roundCount}
          onFormatChange={onFormatChange}
          onScoringChange={onScoringChange}
          onCoupleModeChange={onCoupleModeChange}
          onRoundCountChange={onRoundCountChange}
        />

        <LevelSelector selected={level} onSelect={onLevelSelect} />
        <p className="level-warning">
          תמיד אפשר לדלג על משימה או שאלה שלא מתאימה לכם.
        </p>

        <label className="settings-field">
          <span>שם לערב (אופציונלי)</span>
          <input
            type="text"
            value={eveningName}
            onChange={(e) => onEveningNameChange(e.target.value)}
            placeholder="לדוגמה: ערב גשם, דייט בבית..."
          />
        </label>

        <div className="player-names">
          <label className="settings-field">
            <span>שחקן 1</span>
            <input
              type="text"
              value={playerOneName}
              onChange={(e) => onPlayerNamesChange(e.target.value, playerTwoName)}
            />
          </label>
          <div className="avatar-picker">
            {AVATAR_OPTIONS.map((a) => (
              <button
                key={`p1-${a}`}
                type="button"
                className={`avatar-opt ${playerOneAvatar === a ? 'selected' : ''}`}
                onClick={() => onPlayerAvatarsChange(a, playerTwoAvatar)}
              >
                {a}
              </button>
            ))}
          </div>
          <div className="color-picker">
            {PLAYER_COLORS.map((c) => (
              <button
                key={`p1c-${c.id}`}
                type="button"
                className={`color-opt ${playerOneColor === c.value ? 'selected' : ''}`}
                style={{ background: c.value }}
                onClick={() => onPlayerColorsChange(c.value, playerTwoColor)}
                aria-label={c.label}
              />
            ))}
          </div>

          <label className="settings-field">
            <span>שחקן 2</span>
            <input
              type="text"
              value={playerTwoName}
              onChange={(e) => onPlayerNamesChange(playerOneName, e.target.value)}
            />
          </label>
          <div className="avatar-picker">
            {AVATAR_OPTIONS.map((a) => (
              <button
                key={`p2-${a}`}
                type="button"
                className={`avatar-opt ${playerTwoAvatar === a ? 'selected' : ''}`}
                onClick={() => onPlayerAvatarsChange(playerOneAvatar, a)}
              >
                {a}
              </button>
            ))}
          </div>
          <div className="color-picker">
            {PLAYER_COLORS.map((c) => (
              <button
                key={`p2c-${c.id}`}
                type="button"
                className={`color-opt ${playerTwoColor === c.value ? 'selected' : ''}`}
                style={{ background: c.value }}
                onClick={() => onPlayerColorsChange(playerOneColor, c.value)}
                aria-label={c.label}
              />
            ))}
          </div>
        </div>

        {gameFormat !== 'fun' && gameFormat !== 'rounds' && (
          <div className="target-score-section">
            <span className="settings-label">יעד נקודות</span>
            <div className="target-score-options">
              {TARGET_OPTIONS.map((opt) => (
                <button
                  key={String(opt.value)}
                  type="button"
                  className={`target-score-btn ${targetScore === opt.value ? 'target-score-btn--selected' : ''}`}
                  onClick={() => onTargetScoreSelect(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {targetScore === 'custom' && (
              <input
                type="number"
                className="custom-target-input"
                min={3}
                max={30}
                value={customTargetScore}
                onChange={(e) => onCustomTargetChange(Number(e.target.value))}
              />
            )}
          </div>
        )}

        <button type="button" className="spin-button pressable" onClick={onContinue}>
          המשך להסבר
        </button>
      </div>
    </section>
  );
}
