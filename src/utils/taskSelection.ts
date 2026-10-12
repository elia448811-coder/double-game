import { getAllContent } from '../data/allContent';
import { getQuestionBankStats } from '../data/allQuestions';
import { meet100Questions } from '../data/meet100Questions';
import { intimacyQuestions } from '../data/intimacyQuestions';
import { matureQuestions, matureTasks } from '../data/matureContent';
import { allTasks } from '../data/allTasks';
import {
  BUILTIN_TASK_CATEGORIES,
  type ContentMode,
  type CoupleTask,
  type GameMode,
  type TaskCategory,
  type TaskLevel,
} from '../types/game';
import { getCachedCategories } from './adminCategories';
import { isTaskHidden, taskAllowedByBoundaries } from './privacy';
import { loadSeenContent } from './contentMemory';
import { readTaskMap } from './taskFeedback';

const MODE_CATEGORIES: Record<GameMode, TaskCategory[]> = {
  funny: ['funny', 'movement', 'creative'],
  romantic: ['romantic', 'calm', 'creative'],
  challenge: ['challenge', 'movement', 'funny'],
  calm: ['calm', 'romantic', 'creative'],
  mixed: ['funny', 'romantic', 'challenge', 'calm', 'creative', 'movement'],
  spicy: ['spicy'],
};

const LEVEL_ORDER: TaskLevel[] = ['easy', 'normal', 'advanced'];

export function getCategoriesForMode(mode: GameMode): TaskCategory[] {
  const base = MODE_CATEGORIES[mode];
  if (mode !== 'mixed') return base;
  const builtin = new Set<string>(BUILTIN_TASK_CATEGORIES);
  const custom = getCachedCategories()
    .map((c) => c.id)
    .filter((id) => !builtin.has(id) && id !== 'spicy');
  return [...base, ...custom];
}

function levelDown(level: TaskLevel): TaskLevel {
  const i = LEVEL_ORDER.indexOf(level);
  return LEVEL_ORDER[Math.max(0, i - 1)];
}

function levelUp(level: TaskLevel): TaskLevel {
  const i = LEVEL_ORDER.indexOf(level);
  return LEVEL_ORDER[Math.min(LEVEL_ORDER.length - 1, i + 1)];
}

function matchesContentMode(item: CoupleTask, contentMode: ContentMode, mode: GameMode): boolean {
  const kind = item.kind ?? 'task';
  if (mode === 'spicy') {
    if (contentMode === 'tasks') return kind === 'task';
    if (contentMode === 'questions') return kind === 'question';
    return true;
  }
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
    preferredQuestionGroup?: string | null;
    coupleOnly?: boolean;
    categoryFilter?: TaskCategory | null;
    levelOverride?: TaskLevel;
    contentMode?: ContentMode;
    excludeIds?: string[];
    exactLevel?: TaskLevel;
    allowedIds?: string[];
    personalize?: boolean;
    preferUnseen?: boolean;
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

  const allowedIds = options.allowedIds ? new Set(options.allowedIds) : null;
  return getAllContent().filter((task: CoupleTask) => {
    if (allowedIds && !allowedIds.has(task.id)) return false;
    if (isTaskHidden(task.id)) return false;
    if (!taskAllowedByBoundaries(task)) return false;
    if (task.category === 'spicy' && mode !== 'spicy') return false;
    if (mode === 'spicy' && task.category !== 'spicy') return false;
    if (!matchesContentMode(task, contentMode, mode)) return false;
    if (usedIds.includes(task.id)) return false;
    if (options.excludeIds?.includes(task.id)) return false;
    if (options.exactLevel && task.level !== options.exactLevel) return false;
    if (!allowedLevels.includes(task.level)) return false;
    if (task.level === 'advanced' && !advancedEnabled) return false;
    if (options.coupleOnly && !task.isCoupleTask) return false;
    if (options.categoryFilter && task.category !== options.categoryFilter) return false;
    if (options.preferredQuestionGroup) {
      return (
        task.kind === 'question' &&
        task.questionGroup === options.preferredQuestionGroup &&
        modeCategories.includes(task.category)
      );
    }
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
  options: Parameters<typeof filterTasks>[4] = {},
): CoupleTask | null {
  const pool = filterTasks(mode, level, usedIds, advancedEnabled, options);
  return choosePreferredContent(pool.length ? pool : filterTasks(mode, level, [], advancedEnabled, options), options);
}

/** Preferences rank an already allowed pool; they never relax content restrictions. */
export function choosePreferredContent(
  pool: CoupleTask[], options: { personalize?: boolean; preferUnseen?: boolean; allowedIds?: string[] } = {}, random = Math.random(),
): CoupleTask | null {
  if (!pool.length) return null;
  let candidates = pool;
  if (options.preferUnseen !== false && options.allowedIds === undefined) {
    const seen = new Map(loadSeenContent().map((item) => [item.id, item.atMs]));
    const unseen = pool.filter((item) => !seen.has(item.id));
    if (unseen.length) candidates = unseen;
    else {
      // When everything was seen, reuse the oldest quarter rather than the last card.
      candidates = [...pool].sort((a, b) => (seen.get(a.id) ?? 0) - (seen.get(b.id) ?? 0))
        .slice(0, Math.max(1, Math.ceil(pool.length / 4)));
    }
  }
  const ratings = options.personalize === false ? {} : readTaskMap();
  const affinity = new Map<string, number>();
  if (options.personalize !== false) {
    for (const item of getAllContent()) {
      const rating = ratings[item.id];
      if (!rating) continue;
      const topic = `${item.kind ?? 'task'}:${item.questionGroup ?? item.category}`;
      affinity.set(topic, (affinity.get(topic) ?? 0) + (rating === 'up' ? 1 : -1));
    }
  }
  const weights = candidates.map((item) => {
    const direct = ratings[item.id] === 'up' ? 3 : ratings[item.id] === 'down' ? 0.2 : 1;
    const topic = `${item.kind ?? 'task'}:${item.questionGroup ?? item.category}`;
    return direct * Math.max(0.5, Math.min(1.5, 1 + (affinity.get(topic) ?? 0) * 0.1));
  });
  let cursor = Math.max(0, Math.min(1, random)) * weights.reduce((sum, weight) => sum + weight, 0);
  for (let index = 0; index < candidates.length; index++) {
    cursor -= weights[index];
    if (cursor < 0) return candidates[index];
  }
  return candidates[candidates.length - 1];
}

export function pickEasierTask(
  mode: GameMode,
  level: TaskLevel,
  usedIds: string[],
  advancedEnabled: boolean,
  options: Parameters<typeof pickRandomTask>[4] = {},
): CoupleTask | null {
  if (level === 'easy') return null;
  return pickRandomTask(mode, level, usedIds, advancedEnabled, {
    ...options,
    levelOverride: levelDown(level),
    exactLevel: levelDown(level),
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
    exactLevel: levelUp(level),
  });
}

export function getTasksByCategory(category: TaskCategory): CoupleTask[] {
  return getAllContent().filter((t: CoupleTask) => t.category === category);
}

export function getTaskBankStats() {
  const byCategory = {} as Record<TaskCategory, number>;
  for (const t of [...allTasks, ...matureTasks]) {
    const cat = t.category;
    byCategory[cat] = (byCategory[cat] ?? 0) + 1;
  }
  return { total: allTasks.length + matureTasks.length, byCategory };
}

export function getFullBankStats(contentMode: ContentMode = 'mixed', mode: GameMode = 'mixed') {
  const taskStats = getTaskBankStats();
  const questionStats = getQuestionBankStats();
  const meet100Count = meet100Questions.length;
  const intimacyCount = intimacyQuestions.length;
  const matureTaskCount = matureTasks.length;
  const matureQuestionCount = matureQuestions.length;

  if (mode === 'spicy') {
    if (contentMode === 'tasks') {
      return { total: matureTaskCount, tasks: matureTaskCount, questions: 0, byCategory: { spicy: matureTaskCount } as Record<TaskCategory, number> };
    }
    if (contentMode === 'questions') {
      return { total: matureQuestionCount, tasks: 0, questions: matureQuestionCount, byCategory: { spicy: matureQuestionCount } as Record<TaskCategory, number> };
    }
    return {
      total: matureTaskCount + matureQuestionCount,
      tasks: matureTaskCount,
      questions: matureQuestionCount,
      byCategory: { spicy: matureTaskCount + matureQuestionCount } as Record<TaskCategory, number>,
    };
  }

  if (contentMode === 'tasks') {
    return { total: taskStats.total, tasks: taskStats.total, questions: 0, byCategory: taskStats.byCategory };
  }
  if (contentMode === 'questions') {
    const questionTotal = questionStats.total + meet100Count + intimacyCount + matureQuestionCount;
    return {
      total: questionTotal,
      tasks: 0,
      questions: questionTotal,
      byCategory: { ...questionStats.byCategory, spicy: matureQuestionCount } as Record<TaskCategory, number>,
    };
  }
  return {
    total: taskStats.total + questionStats.total + meet100Count + intimacyCount + matureQuestionCount,
    tasks: taskStats.total,
    questions: questionStats.total + meet100Count + intimacyCount + matureQuestionCount,
    byCategory: taskStats.byCategory,
  };
}
