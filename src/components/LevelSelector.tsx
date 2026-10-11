import { RadioGroup } from './RadioGroup';
import { LEVEL_LABELS, type TaskLevel } from '../types/game';

type LevelSelectorProps = {
  selected: TaskLevel;
  onSelect: (level: TaskLevel) => void;
};

const LEVELS: TaskLevel[] = ['easy', 'normal', 'advanced'];

export function LevelSelector({ selected, onSelect }: LevelSelectorProps) {
  return <RadioGroup className="level-choice" label="בחירת רמת משימות" hideLabel
    value={selected} options={LEVELS.map((level) => ({ value: level, label: LEVEL_LABELS[level] }))}
    onChange={onSelect} />;
}
