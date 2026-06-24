import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, '..', 'src', 'data', 'allQuestions.ts');
const textsPath = join(__dirname, 'questions-texts.json');

const QUESTION_TEXTS = JSON.parse(readFileSync(textsPath, 'utf8'));

export const QUESTION_GROUP_LABELS = {
  deep: 'שאלות היכרות עמוקה',
  funny: 'שאלות מצחיקות',
  romantic: 'שאלות רומנטיות נקיות',
  future: 'שאלות על עתיד',
  routine: 'שאלות על שגרה',
  communication: 'שאלות על תקשורת',
  family: 'שאלות על משפחה וערכים',
  money: 'שאלות על כסף ועבודה',
  creative: 'שאלות יצירתיות',
  icebreaker: 'שאלות פתיחה',
  summary: 'שאלות סיום וסיכום',
  spicy: 'שאלות 18+',
};

const GROUPS = [
  { start: 1, end: 100, questionGroup: 'deep', category: 'romantic', level: 'advanced' },
  { start: 101, end: 120, questionGroup: 'funny', category: 'funny', level: 'easy' },
  { start: 121, end: 140, questionGroup: 'romantic', category: 'romantic', level: 'normal' },
  { start: 141, end: 160, questionGroup: 'future', category: 'calm', level: 'normal' },
  { start: 161, end: 180, questionGroup: 'routine', category: 'calm', level: 'easy' },
  { start: 181, end: 200, questionGroup: 'communication', category: 'calm', level: 'normal' },
  { start: 201, end: 220, questionGroup: 'family', category: 'romantic', level: 'normal' },
  { start: 221, end: 240, questionGroup: 'money', category: 'challenge', level: 'advanced' },
  { start: 241, end: 260, questionGroup: 'creative', category: 'creative', level: 'normal' },
  { start: 261, end: 280, questionGroup: 'icebreaker', category: 'funny', level: 'easy' },
  { start: 281, end: 300, questionGroup: 'summary', category: 'calm', level: 'easy' },
];

function metaForIndex(index) {
  const n = index + 1;
  for (const g of GROUPS) {
    if (n >= g.start && n <= g.end) return g;
  }
  throw new Error(`No group for question ${n}`);
}

function padId(n) {
  return `q-${String(n).padStart(3, '0')}`;
}

function buildQuestionTasks() {
  if (QUESTION_TEXTS.length !== 300) {
    throw new Error(`Expected 300 questions, got ${QUESTION_TEXTS.length}`);
  }
  return QUESTION_TEXTS.map((description, index) => {
    const n = index + 1;
    const { questionGroup, category, level } = metaForIndex(index);
    return {
      id: padId(n),
      title: QUESTION_GROUP_LABELS[questionGroup],
      description,
      kind: 'question',
      questionGroup,
      category,
      level,
      isCoupleTask: true,
    };
  });
}

function renderTs(tasks) {
  const items = tasks
    .map(
      (t) => `  {
    id: '${t.id}',
    title: ${JSON.stringify(t.title)},
    description: ${JSON.stringify(t.description)},
    kind: 'question',
    questionGroup: '${t.questionGroup}',
    category: '${t.category}',
    level: '${t.level}',
    isCoupleTask: true,
  }`,
    )
    .join(',\n');

  const labelsLiteral = JSON.stringify(QUESTION_GROUP_LABELS, null, 2);

  return [
    "import type { CoupleTask } from '../types/game';",
    '',
    `export const QUESTION_GROUP_LABELS = ${labelsLiteral} as const;`,
    '',
    'export type QuestionGroup = keyof typeof QUESTION_GROUP_LABELS;',
    '',
    'export type CoupleQuestionTask = CoupleTask & {',
    "  kind: 'question';",
    '  questionGroup: QuestionGroup;',
    '};',
    '',
    'export const allQuestions: CoupleQuestionTask[] = [',
    items,
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
}

const tasks = buildQuestionTasks();
writeFileSync(outPath, renderTs(tasks), 'utf8');
console.log(`Wrote ${outPath} with ${tasks.length} questions`);
