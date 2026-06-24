import { describe, expect, it } from 'vitest';
import { allContent } from '../data/allContent';
import { allQuestions, getQuestionBankStats } from '../data/allQuestions';
import { allTasks } from '../data/allTasks';
import { DEFAULT_SETTINGS, SPINNER_SEGMENTS } from '../types/game';
import { getFullBankStats } from './taskSelection';

describe('data integrity', () => {
  it('has 150 tasks and 300 questions', () => {
    expect(allTasks.length).toBe(150);
    expect(allQuestions.length).toBe(300);
    expect(allContent.length).toBe(450);
  });

  it('has unique ids across all content', () => {
    const ids = allContent.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all items have non-empty descriptions', () => {
    for (const item of allContent) {
      expect(item.description.trim().length).toBeGreaterThan(5);
      expect(item.id).toBeTruthy();
      expect(item.category).toBeTruthy();
      expect(item.level).toBeTruthy();
    }
  });

  it('questions are marked correctly', () => {
    for (const q of allQuestions) {
      expect(q.kind).toBe('question');
      expect(q.questionGroup).toBeTruthy();
      expect(q.isCoupleTask).toBe(true);
    }
  });

  it('tasks default to task kind', () => {
    for (const t of allTasks) {
      expect(t.kind === undefined || t.kind === 'task').toBe(true);
    }
  });

  it('question groups sum to 300', () => {
    const stats = getQuestionBankStats();
    expect(stats.total).toBe(300);
    const groupSum = Object.values(stats.byGroup).reduce((a, b) => a + b, 0);
    expect(groupSum).toBe(300);
    expect(stats.byGroup.deep).toBe(100);
    expect(stats.byGroup.funny).toBe(20);
    expect(stats.byGroup.summary).toBe(20);
  });

  it('bank stats match content modes', () => {
    expect(getFullBankStats('tasks').total).toBe(150);
    expect(getFullBankStats('questions').total).toBe(300);
    expect(getFullBankStats('mixed').total).toBe(450);
  });

  it('questions have unique wording', () => {
    const texts = allQuestions.map((q) => q.description);
    expect(new Set(texts).size).toBe(texts.length);
  });

  it('questions use clean Hebrew punctuation', () => {
    for (const q of allQuestions) {
      expect(q.description).not.toMatch(/[a-zA-Z]/);
      expect(q.description).not.toContain('פרטנר');
    }
  });

  it('spinner has 8 segments', () => {
    expect(SPINNER_SEGMENTS.length).toBe(8);
    expect(SPINNER_SEGMENTS.filter((s) => s.rare).length).toBe(1);
  });

  it('default settings include all required fields', () => {
    expect(DEFAULT_SETTINGS.lastContentMode).toBe('mixed');
    expect(DEFAULT_SETTINGS.playerOneName).toBeTruthy();
    expect(DEFAULT_SETTINGS.roundCount).toBeGreaterThan(0);
  });
});
