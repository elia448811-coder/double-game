import { allQuestions } from './allQuestions';
import { allTasks } from './allTasks';
import { matureQuestions, matureTasks } from './matureContent';
import type { ContentKind, CoupleTask } from '../types/game';

export const allContent: CoupleTask[] = [
  ...allTasks,
  ...allQuestions,
  ...matureTasks,
  ...matureQuestions,
];

export function isQuestion(item: CoupleTask): boolean {
  return item.kind === 'question';
}

export function contentKind(item: CoupleTask): ContentKind {
  return item.kind ?? 'task';
}

export function getContentBankStats() {
  const tasks = allTasks.length + matureTasks.length;
  const questions = allQuestions.length + matureQuestions.length;
  return { tasks, questions, total: tasks + questions };
}

export function isMatureContent(item: CoupleTask): boolean {
  return item.category === 'spicy';
}
