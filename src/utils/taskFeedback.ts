import { isGuestMode } from './privacy';

const TASK_FEEDBACK_KEY = 'couple-spin-task-feedback';
const EVENING_RATINGS_KEY = 'couple-spin-evening-ratings';

export type TaskRating = 'up' | 'down';

type TaskFeedbackMap = Record<string, TaskRating>;

type EveningRating = {
  eveningName: string;
  stars: number;
  atMs: number;
};

export function readTaskMap(): TaskFeedbackMap {
  try {
    if (isGuestMode()) return {};
    const raw = localStorage.getItem(TASK_FEEDBACK_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).filter(([id, rating]) => id.length <= 128 && (rating === 'up' || rating === 'down')));
  } catch {
    return {};
  }
}

export function getTaskFeedback(taskId: string): TaskRating | null {
  return readTaskMap()[taskId] ?? null;
}

export function setTaskFeedback(taskId: string, rating: TaskRating): void {
  try {
    if (isGuestMode()) return;
    const next = { ...readTaskMap(), [taskId]: rating };
    localStorage.setItem(TASK_FEEDBACK_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

function readEveningRatings(): EveningRating[] {
  try {
    const raw = localStorage.getItem(EVENING_RATINGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as EveningRating[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveEveningRating(eveningName: string, stars: number): void {
  const safeStars = Math.min(5, Math.max(1, Math.round(stars)));
  const label = eveningName.trim() || 'ערב ללא שם';
  try {
    const next: EveningRating[] = [
      { eveningName: label, stars: safeStars, atMs: Date.now() },
      ...readEveningRatings().slice(0, 19),
    ];
    localStorage.setItem(EVENING_RATINGS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function getLatestEveningRating(eveningName: string): number | null {
  const label = eveningName.trim() || 'ערב ללא שם';
  const hit = readEveningRatings().find((r) => r.eveningName === label);
  return hit?.stars ?? null;
}
