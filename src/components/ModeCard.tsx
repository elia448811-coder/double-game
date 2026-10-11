import type { GameMode } from '../types/game';
import { MODE_DESCRIPTIONS, MODE_LABELS } from '../types/game';
import { ContentArtwork } from './ContentArtwork';
import { getModeArtworkKey } from '../data/contentArtwork';

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
      <ContentArtwork artwork={getModeArtworkKey(mode)} variant="option" />
      <strong>{MODE_LABELS[mode]}</strong>
      <p>{MODE_DESCRIPTIONS[mode]}</p>
    </button>
  );
}
