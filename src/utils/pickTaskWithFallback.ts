import type { CoupleTask, GameMode, TaskCategory, TaskLevel } from '../types/game';
import { pickRandomTask } from './taskSelection';

type PickOptions = Parameters<typeof pickRandomTask>[4];

function spinPickOptions(segment: {
  category: TaskCategory | null;
  questionGroup?: string;
}): PickOptions {
  if (segment.questionGroup) {
    return { preferredQuestionGroup: segment.questionGroup, preferredCategory: null };
  }
  return { preferredCategory: segment.category, preferredQuestionGroup: null };
}

export { spinPickOptions };
export function pickTaskWithFallback(
  mode: GameMode,
  level: TaskLevel,
  usedIds: string[],
  advancedEnabled: boolean,
  options: PickOptions = {},
): CoupleTask | null {
  const task = pickRandomTask(mode, level, usedIds, advancedEnabled, options);
  if (task) return task;

  if (options.preferredQuestionGroup) {
    const anyGroup = pickRandomTask(mode, level, usedIds, advancedEnabled, {
      ...options,
      preferredQuestionGroup: null,
    });
    if (anyGroup) return anyGroup;
  }

  if (options.preferredCategory) {
    const anyCategory = pickRandomTask(mode, level, usedIds, advancedEnabled, {
      ...options,
      preferredCategory: null,
    });
    if (anyCategory) return anyCategory;
  }

  // Only wheel preferences may be relaxed; the players' restrictions still apply.
  return pickRandomTask(mode, level, usedIds, advancedEnabled, {
    ...options,
    preferredCategory: null,
    preferredQuestionGroup: null,
  });
}
