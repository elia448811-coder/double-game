import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = dirname(fileURLToPath(import.meta.url));
const textsPath = join(root, 'meet100-texts.json');
const outPath = join(root, '..', 'src', 'data', 'meet100Questions.ts');

const TEXTS = JSON.parse(readFileSync(textsPath, 'utf8'));

if (TEXTS.length !== 100) {
  throw new Error(`Expected 100 questions, got ${TEXTS.length}`);
}

const seen = new Set();
for (const t of TEXTS) {
  if (seen.has(t)) throw new Error(`Duplicate: ${t}`);
  seen.add(t);
}

export const MEET100_GROUP_LABEL = '100 שאלות היכרות עמוקה ומעניינת לזוגות';

const items = TEXTS.map((description, index) => {
  const n = index + 1;
  const id = `meet-${String(n).padStart(3, '0')}`;
  const level = n <= 40 ? 'easy' : n <= 80 ? 'normal' : 'advanced';
  return `  {
    id: '${id}',
    title: ${JSON.stringify(MEET100_GROUP_LABEL)},
    description: ${JSON.stringify(description)},
    kind: 'question',
    questionGroup: 'meet100',
    category: 'challenge',
    level: '${level}',
    isCoupleTask: true,
  }`;
});

const out = [
  "import type { CoupleTask } from '../types/game';",
  '',
  `export const MEET100_GROUP_LABEL = ${JSON.stringify(MEET100_GROUP_LABEL)};`,
  '',
  'export type Meet100QuestionTask = CoupleTask & {',
  "  kind: 'question';",
  "  questionGroup: 'meet100';",
  '};',
  '',
  'export const meet100Questions: Meet100QuestionTask[] = [',
  items.join(',\n'),
  '];',
  '',
].join('\n');

writeFileSync(outPath, out, 'utf8');
console.log(`Wrote ${outPath} with ${TEXTS.length} questions`);
