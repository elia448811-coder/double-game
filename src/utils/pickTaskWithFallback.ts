import { allContent } from '../data/allContent';
import type { ContentMode, CoupleTask, GameMode, TaskCategory, TaskLevel } from '../types/game';
import { filterTasks, pickRandomTask } from './taskSelection';

type PickOptions = {
  preferredCategory?: TaskCategory | null;
  preferredQuestionGroup?: string | null;
  coupleOnly?: boolean;
  categoryFilter?: TaskCategory | null;
  levelOverride?: TaskLevel;
  contentMode?: ContentMode;
};

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
): CoupleTask {
  const task = pickRandomTask(mode, level, usedIds, advancedEnabled, options);
  if (task) return task;

  const resetPool = pickRandomTask(mode, level, [], advancedEnabled, options);
  if (resetPool) return resetPool;

  if (options.coupleOnly) {
    const withoutCouple = pickRandomTask(mode, level, usedIds, advancedEnabled, {
      ...options,
      coupleOnly: false,
    });
    if (withoutCouple) return withoutCouple;
  }

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

  const pool = filterTasks(mode, level, [], advancedEnabled, { ...options, coupleOnly: false });
  if (pool.length > 0) return pool[Math.floor(Math.random() * pool.length)];

  const modePool = allContent.filter((c) => {
    const kind = c.kind ?? 'task';
    if (options.contentMode === 'tasks') return kind === 'task';
    if (options.contentMode === 'questions') return kind === 'question';
    return true;
  });
  return modePool[0] ?? allContent[0];
}
