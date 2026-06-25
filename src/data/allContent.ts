import { allQuestions } from './allQuestions';
import { allTasks } from './allTasks';
import { intimacyQuestions } from './intimacyQuestions';
import { meet100Questions } from './meet100Questions';
import { matureQuestions, matureTasks } from './matureContent';
import { getCustomCoupleTasks } from '../utils/customContent';
import type { ContentKind, CoupleTask } from '../types/game';

const builtInContent: CoupleTask[] = [
  ...allTasks,
  ...allQuestions,
  ...meet100Questions,
  ...intimacyQuestions,
  ...matureTasks,
  ...matureQuestions,
];

/** מאגר מלא כולל תוכן מותאם אישית מה-localStorage */
export function getAllContent(): CoupleTask[] {
  return [...builtInContent, ...getCustomCoupleTasks()];
}

/** @deprecated השתמשו ב-getAllContent() — נשמר לתאימות */
export const allContent: CoupleTask[] = builtInContent;

export function isQuestion(item: CoupleTask): boolean {
  return item.kind === 'question';
}

export function contentKind(item: CoupleTask): ContentKind {
  return item.kind ?? 'task';
}

export function getContentBankStats() {
  const custom = getCustomCoupleTasks();
  const customTasks = custom.filter((c) => (c.kind ?? 'task') === 'task').length;
  const customQuestions = custom.filter((c) => c.kind === 'question').length;

  const tasks = allTasks.length + matureTasks.length + customTasks;
  const questions =
    allQuestions.length +
    meet100Questions.length +
    intimacyQuestions.length +
    matureQuestions.length +
    customQuestions;
  return { tasks, questions, total: tasks + questions, custom: custom.length };
}

export function isMatureContent(item: CoupleTask): boolean {
  return item.category === 'spicy';
}
