import type { TaskLevel } from '../types/game';
import { LEVEL_LABELS } from '../types/game';

type LevelSelectorProps = {
  selected: TaskLevel;
  onSelect: (level: TaskLevel) => void;
};

const LEVELS: TaskLevel[] = ['easy', 'normal', 'advanced'];

export function LevelSelector({ selected, onSelect }: LevelSelectorProps) {
  return (
    <div className="level-selector" role="radiogroup" aria-label="בחירת רמת משימות">
      {LEVELS.map((level) => (
        <button
          key={level}
          type="button"
          role="radio"
          aria-checked={selected === level}
          className={`level-selector__btn ${selected === level ? 'level-selector__btn--selected' : ''}`}
          onClick={() => onSelect(level)}
        >
          {LEVEL_LABELS[level]}
        </button>
      ))}
    </div>
  );
}
