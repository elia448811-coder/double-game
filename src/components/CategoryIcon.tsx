import { CATEGORY_ICONS } from '../types/game';
import type { TaskCategory } from '../types/game';

type CategoryIconProps = {
  category: TaskCategory;
  size?: 'sm' | 'md' | 'lg';
};

export function CategoryIcon({ category, size = 'md' }: CategoryIconProps) {
  return (
    <span className={`category-icon category-icon--${size}`} aria-hidden="true">
      {CATEGORY_ICONS[category]}
    </span>
  );
}
