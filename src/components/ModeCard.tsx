import type { GameMode } from '../types/game';
import { MODE_DESCRIPTIONS, MODE_LABELS } from '../types/game';

const MODE_EMOJI: Record<GameMode, string> = {
  funny: '😂',
  romantic: '💜',
  challenge: '🏆',
  calm: '🌙',
  mixed: '🎲',
  spicy: '🔥',
};

type ModeCardProps = {
  mode: GameMode;
  selected: boolean;
  onSelect: (mode: GameMode) => void;
};

export function ModeCard({ mode, selected, onSelect }: ModeCardProps) {
  return (
    <button
      type="button"
      className={`mode-card ${selected ? 'selected' : ''}`}
      onClick={() => onSelect(mode)}
      aria-pressed={selected}
      aria-label={`בחר מצב ${MODE_LABELS[mode]}`}
    >
      <span className="mode-card__emoji">{MODE_EMOJI[mode]}</span>
      <strong>{MODE_LABELS[mode]}</strong>
      <p>{MODE_DESCRIPTIONS[mode]}</p>
    </button>
  );
}
