/**
 * מייצר את מאגר השאלות מ-couples_questions_experience_he.txt
 * 300 שאלות ראשיות + 100 meet100 + 20 קרבה נקייה
 */
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = dirname(fileURLToPath(import.meta.url));
const srcPath = join(root, '..', 'couples_questions_experience_he.txt');

const SECTION_MAP = [
  { match: 'לב אל לב', group: 'deep', category: 'romantic', level: 'advanced' },
  { match: 'סיבוב צחוקים', group: 'funny', category: 'funny', level: 'easy' },
  { match: 'רגעים קטנים', group: 'romantic', category: 'romantic', level: 'normal' },
  { match: 'מבט קדימה', group: 'future', category: 'calm', level: 'normal' },
  { match: 'החיים עצמם', group: 'routine', category: 'calm', level: 'easy' },
  { match: 'מדברים פתוח', group: 'communication', category: 'calm', level: 'normal' },
  { match: 'בית, משפחה', group: 'family', category: 'romantic', level: 'normal' },
  { match: 'כסף, עבודה', group: 'money', category: 'challenge', level: 'advanced' },
  { match: 'דמיון חופשי', group: 'creative', category: 'creative', level: 'normal' },
  { match: 'חימום נעים', group: 'icebreaker', category: 'funny', level: 'easy' },
  { match: 'סגירת ערב', group: 'summary', category: 'calm', level: 'easy' },
  { match: 'עוד 100 שאלות עומק', group: 'meet100', category: 'challenge', level: 'easy' },
  { match: 'קרבה זוגית נקייה', group: 'intimacy', category: 'romantic', level: 'normal' },
];

const GROUP_LABELS = {
  deep: 'לב אל לב — היכרות עמוקה',
  funny: 'סיבוב צחוקים — קליל ומשחרר',
  romantic: 'רגעים קטנים של אהבה',
  future: 'מבט קדימה — חלומות ותוכניות',
  routine: 'החיים עצמם — שגרה שעושה טוב',
  communication: 'מדברים פתוח — תקשורת מקרבת',
  family: 'בית, משפחה וערכים',
  money: 'כסף, עבודה ואיזון',
  creative: 'דמיון חופשי — שאלות יצירתיות',
  icebreaker: 'חימום נעים — לפתוח את הערב',
  summary: 'סגירת ערב — מה לוקחים איתנו',
  meet100: 'עוד 100 שאלות עומק — להכיר באמת',
  intimacy: 'קרבה זוגית נקייה ומכבדת',
  spicy: 'שאלות 18+',
};

const MEET100_LABEL = GROUP_LABELS.meet100;
const INTIMACY_LABEL = GROUP_LABELS.intimacy;

function detectSection(line) {
  for (const s of SECTION_MAP) {
    if (line.includes(s.match)) return s;
  }
  return null;
}

function parseExperienceFile(content) {
  const buckets = Object.fromEntries(SECTION_MAP.map((s) => [s.group, []]));
  let current = null;

  for (const raw of content.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;

    const section = detectSection(line);
    if (section) {
      current = section.group;
      continue;
    }

    const q = line.match(/^\d+\.\s*(.+)$/);
    if (q) {
      if (!current) throw new Error(`שאלה ללא קטגוריה: ${line.slice(0, 60)}`);
      buckets[current].push(q[1].trim());
    }
  }

  return buckets;
}

function renderQuestionItem(t) {
  return `  {
    id: '${t.id}',
    title: ${JSON.stringify(t.title)},
    description: ${JSON.stringify(t.description)},
    kind: 'question',
    questionGroup: '${t.questionGroup}',
    category: '${t.category}',
    level: '${t.level}',
    isCoupleTask: true,
  }`;
}

function buildAllQuestions(buckets) {
  const mainGroups = SECTION_MAP.filter((s) => !['meet100', 'intimacy'].includes(s.group));
  const tasks = [];
  let n = 0;

  for (const { group, category, level } of mainGroups) {
    const texts = buckets[group];
    if (!texts?.length) throw new Error(`חסרות שאלות בקבוצה ${group}`);
    for (const description of texts) {
      n += 1;
      tasks.push({
        id: `q-${String(n).padStart(3, '0')}`,
        title: GROUP_LABELS[group],
        description,
        questionGroup: group,
        category,
        level,
      });
    }
  }

  if (tasks.length < 280) throw new Error(`מעט מדי שאלות ראשיות: ${tasks.length}`);
  return tasks;
}

function buildMeet100(buckets) {
  const texts = buckets.meet100;
  if (texts.length !== 100) throw new Error(`צפוי 100 meet100, קיבל ${texts.length}`);
  return texts.map((description, i) => {
    const n = i + 1;
    const level = n <= 40 ? 'easy' : n <= 80 ? 'normal' : 'advanced';
    return {
      id: `meet-${String(n).padStart(3, '0')}`,
      title: MEET100_LABEL,
      description,
      questionGroup: 'meet100',
      category: 'challenge',
      level,
    };
  });
}

function buildIntimacy(buckets) {
  const texts = buckets.intimacy;
  if (texts.length !== 20) throw new Error(`צפוי 20 intimacy, קיבל ${texts.length}`);
  return texts.map((description, i) => ({
    id: `intim-${String(i + 1).padStart(3, '0')}`,
    title: INTIMACY_LABEL,
    description,
    questionGroup: 'intimacy',
    category: 'romantic',
    level: 'normal',
  }));
}

function writeAllQuestions(tasks) {
  const labels = { ...GROUP_LABELS };
  delete labels.meet100;
  delete labels.intimacy;

  const out = [
    "import type { CoupleTask } from '../types/game';",
    '',
    `export const QUESTION_GROUP_LABELS = ${JSON.stringify(labels, null, 2)} as const;`,
    '',
    'export type QuestionGroup = keyof typeof QUESTION_GROUP_LABELS;',
    '',
    'export type CoupleQuestionTask = CoupleTask & {',
    "  kind: 'question';",
    '  questionGroup: QuestionGroup;',
    '};',
    '',
    'export const allQuestions: CoupleQuestionTask[] = [',
    tasks.map(renderQuestionItem).join(',\n'),
    '];',
    '',
    'export function getQuestionBankStats() {',
    '  const byGroup = {} as Record<string, number>;',
    '  const byCategory = {} as Record<string, number>;',
    '  const byLevel = {} as Record<string, number>;',
    '  for (const q of allQuestions) {',
    '    byGroup[q.questionGroup] = (byGroup[q.questionGroup] ?? 0) + 1;',
    '    byCategory[q.category] = (byCategory[q.category] ?? 0) + 1;',
    '    byLevel[q.level] = (byLevel[q.level] ?? 0) + 1;',
    '  }',
    '  return { total: allQuestions.length, byGroup, byCategory, byLevel };',
    '}',
    '',
  ].join('\n');

  writeFileSync(join(root, '..', 'src', 'data', 'allQuestions.ts'), out, 'utf8');
}

function writeMeet100(tasks) {
  const out = [
    "import type { CoupleTask } from '../types/game';",
    '',
    `export const MEET100_GROUP_LABEL = ${JSON.stringify(MEET100_LABEL)};`,
    '',
    'export type Meet100QuestionTask = CoupleTask & {',
    "  kind: 'question';",
    "  questionGroup: 'meet100';",
    '};',
    '',
    'export const meet100Questions: Meet100QuestionTask[] = [',
    tasks.map(renderQuestionItem).join(',\n'),
    '];',
    '',
  ].join('\n');

  writeFileSync(join(root, '..', 'src', 'data', 'meet100Questions.ts'), out, 'utf8');
}

function writeIntimacy(tasks) {
  const out = [
    "import type { CoupleTask } from '../types/game';",
    '',
    `export const INTIMACY_GROUP_LABEL = ${JSON.stringify(INTIMACY_LABEL)};`,
    '',
    'export type IntimacyQuestionTask = CoupleTask & {',
    "  kind: 'question';",
    "  questionGroup: 'intimacy';",
    '};',
    '',
    'export const intimacyQuestions: IntimacyQuestionTask[] = [',
    tasks.map(renderQuestionItem).join(',\n'),
    '];',
    '',
  ].join('\n');

  writeFileSync(join(root, '..', 'src', 'data', 'intimacyQuestions.ts'), out, 'utf8');
}

const content = readFileSync(srcPath, 'utf8');
const buckets = parseExperienceFile(content);
const allQ = buildAllQuestions(buckets);
const meet100 = buildMeet100(buckets);
const intimacy = buildIntimacy(buckets);

const allTexts = [...allQ, ...meet100, ...intimacy].map((t) => t.description);
if (new Set(allTexts).size !== allTexts.length) {
  const dupes = allTexts.filter((t, i) => allTexts.indexOf(t) !== i);
  throw new Error(`שאלות כפולות: ${dupes.slice(0, 3).join(' | ')}`);
}

writeAllQuestions(allQ);
writeMeet100(meet100);
writeIntimacy(intimacy);

console.log(`✓ allQuestions.ts — ${allQ.length}`);
console.log(`✓ meet100Questions.ts — ${meet100.length}`);
console.log(`✓ intimacyQuestions.ts — ${intimacy.length}`);
console.log(`  סה"כ ${allTexts.length} שאלות חווייתיות`);
