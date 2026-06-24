import { allContent } from '../data/allContent';
import { getQuestionBankStats } from '../data/allQuestions';
import { allTasks } from '../data/allTasks';
import type { ContentMode, CoupleTask, GameMode, TaskCategory, TaskLevel } from '../types/game';

const MODE_CATEGORIES: Record<GameMode, TaskCategory[]> = {
  funny: ['funny', 'movement', 'creative'],
  romantic: ['romantic', 'calm', 'creative'],
  challenge: ['challenge', 'movement', 'funny'],
  calm: ['calm', 'romantic', 'creative'],
  mixed: ['funny', 'romantic', 'challenge', 'calm', 'creative', 'movement'],
};

const LEVEL_ORDER: TaskLevel[] = ['easy', 'normal', 'advanced'];

export function getCategoriesForMode(mode: GameMode): TaskCategory[] {
  return MODE_CATEGORIES[mode];
}

function levelDown(level: TaskLevel): TaskLevel {
  const i = LEVEL_ORDER.indexOf(level);
  return LEVEL_ORDER[Math.max(0, i - 1)];
}

function levelUp(level: TaskLevel): TaskLevel {
  const i = LEVEL_ORDER.indexOf(level);
  return LEVEL_ORDER[Math.min(LEVEL_ORDER.length - 1, i + 1)];
}

function matchesContentMode(item: CoupleTask, contentMode: ContentMode): boolean {
  const kind = item.kind ?? 'task';
  if (contentMode === 'tasks') return kind === 'task';
  if (contentMode === 'questions') return kind === 'question';
  return true;
}

export function filterTasks(
  mode: GameMode,
  level: TaskLevel,
  usedIds: string[],
  advancedEnabled: boolean,
  options: {
    preferredCategory?: TaskCategory | null;
    coupleOnly?: boolean;
    categoryFilter?: TaskCategory | null;
    levelOverride?: TaskLevel;
    contentMode?: ContentMode;
  } = {},
): CoupleTask[] {
  const modeCategories = getCategoriesForMode(mode);
  const effectiveLevel = options.levelOverride ?? level;
  const contentMode = options.contentMode ?? 'tasks';
  const allowedLevels: TaskLevel[] =
    effectiveLevel === 'easy'
      ? ['easy']
      : effectiveLevel === 'normal'
        ? ['easy', 'normal']
        : ['easy', 'normal', 'advanced'];

  return allContent.filter((task: CoupleTask) => {
    if (!matchesContentMode(task, contentMode)) return false;
    if (usedIds.includes(task.id)) return false;
    if (!allowedLevels.includes(task.level)) return false;
    if (task.level === 'advanced' && !advancedEnabled) return false;
    if (options.coupleOnly && !task.isCoupleTask) return false;
    if (options.categoryFilter && task.category !== options.categoryFilter) return false;
    if (options.preferredCategory) {
      return task.category === options.preferredCategory && modeCategories.includes(task.category);
    }
    return modeCategories.includes(task.category);
  });
}

export function pickRandomTask(
  mode: GameMode,
  level: TaskLevel,
  usedIds: string[],
  advancedEnabled: boolean,
  options: {
    preferredCategory?: TaskCategory | null;
    coupleOnly?: boolean;
    categoryFilter?: TaskCategory | null;
    levelOverride?: TaskLevel;
    contentMode?: ContentMode;
  } = {},
): CoupleTask | null {
  const pool = filterTasks(mode, level, usedIds, advancedEnabled, options);
  if (pool.length === 0) {
    const fallback = filterTasks(mode, level, [], advancedEnabled, options);
    if (fallback.length === 0) return null;
    return fallback[Math.floor(Math.random() * fallback.length)];
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

export function pickEasierTask(
  mode: GameMode,
  level: TaskLevel,
  usedIds: string[],
  advancedEnabled: boolean,
  options: Parameters<typeof pickRandomTask>[4] = {},
): CoupleTask | null {
  return pickRandomTask(mode, level, usedIds, advancedEnabled, {
    ...options,
    levelOverride: levelDown(level),
  });
}

export function pickHarderTask(
  mode: GameMode,
  level: TaskLevel,
  usedIds: string[],
  advancedEnabled: boolean,
  options: Parameters<typeof pickRandomTask>[4] = {},
): CoupleTask | null {
  if (level === 'advanced') return null;
  return pickRandomTask(mode, level, usedIds, advancedEnabled, {
    ...options,
    levelOverride: levelUp(level),
  });
}

export function getTasksByCategory(category: TaskCategory): CoupleTask[] {
  return allContent.filter((t: CoupleTask) => t.category === category);
}

export function getTaskBankStats() {
  const byCategory = {} as Record<TaskCategory, number>;
  for (const t of allTasks) {
    const cat = t.category;
    byCategory[cat] = (byCategory[cat] ?? 0) + 1;
  }
  return { total: allTasks.length, byCategory };
}

export function getFullBankStats(contentMode: ContentMode = 'mixed') {
  const taskStats = getTaskBankStats();
  const questionStats = getQuestionBankStats();
  if (contentMode === 'tasks') {
    return { total: taskStats.total, tasks: taskStats.total, questions: 0, byCategory: taskStats.byCategory };
  }
  if (contentMode === 'questions') {
    return { total: questionStats.total, tasks: 0, questions: questionStats.total, byCategory: questionStats.byCategory };
  }
  return {
    total: taskStats.total + questionStats.total,
    tasks: taskStats.total,
    questions: questionStats.total,
    byCategory: taskStats.byCategory,
  };
}
