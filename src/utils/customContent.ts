import type { ContentKind, CoupleTask, TaskCategory, TaskLevel } from '../types/game';

const CUSTOM_CONTENT_KEY = 'couple-spin-custom-content';

export type CustomContentItem = {
  id: string;
  kind: ContentKind;
  title: string;
  description: string;
  category: TaskCategory;
  level: TaskLevel;
  questionGroup?: string;
  createdAt: string;
};

export type NewCustomContentInput = {
  kind: ContentKind;
  title: string;
  description: string;
  category: TaskCategory;
  level: TaskLevel;
  questionGroup?: string;
};

function normalizeText(value: string, maxLen: number): string {
  return value.trim().slice(0, maxLen);
}

export function loadCustomContent(): CustomContentItem[] {
  try {
    const raw = localStorage.getItem(CUSTOM_CONTENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CustomContentItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCustomContent(items: CustomContentItem[]): void {
  localStorage.setItem(CUSTOM_CONTENT_KEY, JSON.stringify(items));
}

export function customToCoupleTask(item: CustomContentItem): CoupleTask {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    category: item.category,
    level: item.level,
    kind: item.kind,
    questionGroup: item.questionGroup,
    isCoupleTask: item.kind === 'task',
  };
}

export function getCustomCoupleTasks(): CoupleTask[] {
  return loadCustomContent().map(customToCoupleTask);
}

export function addCustomContent(input: NewCustomContentInput): CustomContentItem | null {
  const title = normalizeText(input.title, 120);
  const description = normalizeText(input.description, 500);
  if (!title || !description) return null;

  const item: CustomContentItem = {
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    kind: input.kind,
    title,
    description,
    category: input.category,
    level: input.level,
    questionGroup: input.questionGroup?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };

  saveCustomContent([item, ...loadCustomContent()]);
  return item;
}

export function removeCustomContent(id: string): void {
  saveCustomContent(loadCustomContent().filter((item) => item.id !== id));
}

export function getCustomContentStats() {
  const items = loadCustomContent();
  const questions = items.filter((i) => i.kind === 'question').length;
  const tasks = items.filter((i) => i.kind === 'task').length;
  return { total: items.length, questions, tasks };
}
