import { useState } from 'react';
import { LevelSelector } from '../components/LevelSelector';
import type { ContentMode, GameFormat, GameMode, ScoringMode, TargetScore, TaskLevel } from '../types/game';
import { CONTENT_MODE_LABELS, MODE_LABELS } from '../types/game';

type QuickSetupScreenProps = {
  mode: GameMode;
  level: TaskLevel;
  contentMode: ContentMode;
  gameFormat: GameFormat;
  scoringMode: ScoringMode;
  targetScore: TargetScore;
  customTargetScore: number;
  eveningName: string;
  playerOneName: string;
  playerTwoName: string;
  onModeSelect: (mode: GameMode) => void;
  onLevelSelect: (level: TaskLevel) => void;
  onContentModeChange: (mode: ContentMode) => void;
  onFormatChange: (format: GameFormat) => void;
  onScoringChange: (mode: ScoringMode) => void;
  onTargetScoreSelect: (score: TargetScore) => void;
  onCustomTargetChange: (n: number) => void;
  onEveningNameChange: (name: string) => void;
  onPlayerNamesChange: (p1: string, p2: string) => void;
  onStart: () => void;
  onBack: () => void;
};

type VibePreset = 'quick' | 'normal' | 'chill';

const MODES: GameMode[] = ['funny', 'romantic', 'challenge', 'calm', 'mixed'];
const CONTENT_MODES: ContentMode[] = ['tasks', 'questions', 'mixed'];

const MODE_EMOJI: Record<GameMode, string> = {
  funny: '😂',
  romantic: '💜',
  challenge: '🏆',
  calm: '🌙',
  mixed: '🎲',
};

const CONTENT_EMOJI: Record<ContentMode, string> = {
  tasks: '🎯',
  questions: '💬',
  mixed: '✨',
};

const VIBE_PRESETS: {
  id: VibePreset;
  emoji: string;
  label: string;
  hint: string;
  format: GameFormat;
  scoring: ScoringMode;
  target: TargetScore;
}[] = [
  { id: 'quick', emoji: '⚡', label: 'מהיר', hint: '~10 דק׳ · יעד 5', format: 'quick', scoring: 'competitive', target: 5 },
  { id: 'normal', emoji: '🎯', label: 'רגיל', hint: 'משחק מלא · יעד 10', format: 'normal', scoring: 'competitive', target: 10 },
  { id: 'chill', emoji: '💫', label: 'בלי לחץ', hint: 'בלי ניקוד · בקצב שלכם', format: 'fun', scoring: 'none', target: 'free' },
];

function deriveVibe(format: GameFormat, scoring: ScoringMode): VibePreset {
  if (format === 'fun' || scoring === 'none') return 'chill';
  if (format === 'quick') return 'quick';
  return 'normal';
}

export function QuickSetupScreen({
  mode,
  level,
  contentMode,
  gameFormat,
  scoringMode,
  targetScore,
  customTargetScore,
  eveningName,
  playerOneName,
  playerTwoName,
  onModeSelect,
  onLevelSelect,
  onContentModeChange,
  onFormatChange,
  onScoringChange,
  onTargetScoreSelect,
  onCustomTargetChange,
  onEveningNameChange,
  onPlayerNamesChange,
  onStart,
  onBack,
}: QuickSetupScreenProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const vibe = deriveVibe(gameFormat, scoringMode);
  const showTarget = vibe !== 'chill';

  const applyVibe = (preset: (typeof VIBE_PRESETS)[number]) => {
    onFormatChange(preset.format);
    onScoringChange(preset.scoring);
    onTargetScoreSelect(preset.target);
  };

  return (
    <section className="page-screen setup-screen">
      <div className="setup-card">
        <header className="setup-header">
          <button type="button" className="icon-btn" onClick={onBack} aria-label="חזרה">
            →
          </button>
          <div>
            <h1 className="setup-title">מוכנים לשחק?</h1>
            <p className="setup-sub">3 בחירות ומתחילים — אפשר לשנות תמיד</p>
          </div>
        </header>

        <div className="setup-body">
          <section className="setup-block">
            <h2 className="setup-label">איזה וייב?</h2>
            <div className="chip-scroll" role="list">
              {MODES.map((m) => (
                <button
                  key={m}
                  type="button"
                  role="listitem"
                  className={`choice-chip ${mode === m ? 'choice-chip--on' : ''}`}
                  onClick={() => onModeSelect(m)}
                  aria-pressed={mode === m}
                >
                  <span className="choice-chip__emoji">{MODE_EMOJI[m]}</span>
                  {MODE_LABELS[m]}
                </button>
              ))}
            </div>
          </section>

          <section className="setup-block">
            <h2 className="setup-label">מה משחקים?</h2>
            <div className="choice-row">
              {CONTENT_MODES.map((cm) => (
                <button
                  key={cm}
                  type="button"
                  className={`choice-pill ${contentMode === cm ? 'choice-pill--on' : ''}`}
                  onClick={() => onContentModeChange(cm)}
                  aria-pressed={contentMode === cm}
                >
                  <span>{CONTENT_EMOJI[cm]}</span>
                  {CONTENT_MODE_LABELS[cm].replace(' בלבד', '').replace('משימות + שאלות', 'הכל')}
                </button>
              ))}
            </div>
          </section>

          <section className="setup-block">
            <h2 className="setup-label">כמה זמן?</h2>
            <div className="preset-row">
              {VIBE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={`preset-card ${vibe === preset.id ? 'preset-card--on' : ''}`}
                  onClick={() => applyVibe(preset)}
                  aria-pressed={vibe === preset.id}
                >
                  <span className="preset-card__emoji">{preset.emoji}</span>
                  <strong>{preset.label}</strong>
                  <span className="preset-card__hint">{preset.hint}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="setup-block setup-names">
            <h2 className="setup-label">מי משחק?</h2>
            <div className="name-row">
              <input
                type="text"
                className="name-input"
                value={playerOneName}
                onChange={(e) => onPlayerNamesChange(e.target.value, playerTwoName)}
                placeholder="שחקן 1"
                aria-label="שם שחקן 1"
              />
              <span className="name-vs">×</span>
              <input
                type="text"
                className="name-input"
                value={playerTwoName}
                onChange={(e) => onPlayerNamesChange(playerOneName, e.target.value)}
                placeholder="שחקן 2"
                aria-label="שם שחקן 2"
              />
            </div>
          </section>

          <details
            className="setup-advanced"
            open={advancedOpen}
            onToggle={(e) => setAdvancedOpen((e.target as HTMLDetailsElement).open)}
          >
            <summary className="setup-advanced__toggle">הגדרות מתקדמות</summary>
            <div className="setup-advanced__body">
              <p className="setup-label setup-label--sm">רמת תוכן</p>
              <LevelSelector selected={level} onSelect={onLevelSelect} />

              <label className="setup-field">
                <span>שם לערב (אופציונלי)</span>
                <input
                  type="text"
                  value={eveningName}
                  onChange={(e) => onEveningNameChange(e.target.value)}
                  placeholder="לדוגמה: ערב גשם"
                />
              </label>

              {showTarget && (
                <div className="setup-field">
                  <span>יעד נקודות</span>
                  <div className="target-row">
                    {([5, 10, 15] as const).map((n) => (
                      <button
                        key={n}
                        type="button"
                        className={`target-chip ${targetScore === n ? 'target-chip--on' : ''}`}
                        onClick={() => onTargetScoreSelect(n)}
                      >
                        {n}
                      </button>
                    ))}
                    <button
                      type="button"
                      className={`target-chip ${targetScore === 'custom' ? 'target-chip--on' : ''}`}
                      onClick={() => onTargetScoreSelect('custom')}
                    >
                      מותאם
                    </button>
                  </div>
                  {targetScore === 'custom' && (
                    <input
                      type="number"
                      className="setup-field__input"
                      min={3}
                      max={30}
                      value={customTargetScore}
                      onChange={(e) => onCustomTargetChange(Number(e.target.value))}
                    />
                  )}
                </div>
              )}
            </div>
          </details>
        </div>

        <div className="setup-footer">
          <button type="button" className="cta-button pressable" onClick={onStart}>
            🎡 התחילו לשחק
          </button>
          <p className="setup-hint">תמיד אפשר לדלג על משימה או שאלה</p>
        </div>
      </div>
    </section>
  );
}
