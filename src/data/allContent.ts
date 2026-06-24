import { allQuestions } from './allQuestions';
import { allTasks } from './allTasks';
import type { ContentKind, CoupleTask } from '../types/game';

export const allContent: CoupleTask[] = [...allTasks, ...allQuestions];

export function isQuestion(item: CoupleTask): boolean {
  return item.kind === 'question';
}

export function contentKind(item: CoupleTask): ContentKind {
  return item.kind ?? 'task';
}

export function getContentBankStats() {
  const tasks = allTasks.length;
  const questions = allQuestions.length;
  return { tasks, questions, total: tasks + questions };
}
