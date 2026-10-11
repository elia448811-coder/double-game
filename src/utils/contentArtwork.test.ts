import { describe, expect, it } from 'vitest';
import { builtInContent } from '../data/allContent';
import { CONTENT_ARTWORK, getContentArtworkKey, getModeArtworkKey, type ArtworkKey } from '../data/contentArtwork';
import type { CoupleTask } from '../types/game';

const card = (description: string, extra: Partial<CoupleTask> = {}): CoupleTask => ({
  id: 'custom', description, title: 'שאלה', kind: 'question', category: 'romantic',
  questionGroup: 'deep', level: 'easy', ...extra,
});

describe('question artwork', () => {
  it.each<[string, ArtworkKey]>([
    ['מה עוזר לך להרגיש ביטחון כשאנחנו מדברים?', 'conversation'],
    ['איזה דייט זכור לך במיוחד?', 'date'],
    ['לאן היית רוצה שנצא לטיול?', 'adventure'],
    ['איזה הרגל בבית עושה לך טוב?', 'home'],
    ['מה הדבר הכי מצחיק שעשינו יחד?', 'playful'],
    ['מה עוזר לך להירגע בזמן לחץ?', 'calm'],
    ['איזה סיפור היית רוצה שנכתוב יחד?', 'creative'],
    ['איך נרצה לנהל את התקציב שלנו?', 'growth'],
    ['איזה שיר מזכיר לך אותנו?', 'music'],
    ['איזו מסעדה מתאימה לדייט שלנו?', 'home'],
    ['איך נוכל לדבר בצורה ישירה יותר?', 'conversation'],
  ])('matches the current question: %s', (description, expected) => {
    expect(getContentArtworkKey(card(description))).toBe(expected);
  });

  it('updates artwork when the wording of an existing card changes', () => {
    expect(getContentArtworkKey(card('איזה טיול מתוכנן לנו?', { questionGroup: 'family' }))).toBe('adventure');
    expect(getContentArtworkKey(card('איך מחלקים את התקציב?', { questionGroup: 'family' }))).toBe('growth');
  });
  it('covers every built-in card and unknown custom groups', () => {
    for (const task of builtInContent) expect(CONTENT_ARTWORK[getContentArtworkKey(task)].src).toBeTruthy();
    expect(getContentArtworkKey(card('שאלה אישית', { questionGroup: 'unknown', category: 'unknown' }))).toBe('conversation');
  });
  it('uses a non-explicit romantic scene for mature content', () => {
    expect(getContentArtworkKey(card('שאלה על קרבה', { category: 'spicy' }))).toBe('date');
  });
  it('has artwork for every game mode', () => {
    for (const mode of ['funny', 'romantic', 'challenge', 'calm', 'mixed', 'spicy'] as const) {
      expect(CONTENT_ARTWORK[getModeArtworkKey(mode)]).toBeDefined();
    }
  });
});
