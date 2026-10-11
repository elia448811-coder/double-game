/**
 * מייצא את כל השאלות לקובץ טקסט שאלות.txt
 */
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const SOURCES = [
  { file: 'src/data/allQuestions.ts', label: 'שאלות חווייתיות — קטגוריות' },
  { file: 'src/data/meet100Questions.ts', label: '100 שאלות עומק' },
  { file: 'src/data/intimacyQuestions.ts', label: 'קרבה זוגית נקייה' },
  { file: 'src/data/matureContent.ts', label: 'שאלות 18+' },
];

function unescape(str) {
  return str.replace(/\\"/g, '"').replace(/\\n/g, '\n');
}

function extractFromSource(content, onlyQuestions = false) {
  const items = [];
  const blockRe = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
  let m;
  while ((m = blockRe.exec(content)) !== null) {
    const block = m[0];
    if (onlyQuestions && !/kind:\s*['"]question['"]/.test(block)) continue;
    if (!onlyQuestions && !/kind:\s*['"]question['"]/.test(block)) continue;

    const id = block.match(/id:\s*['"]([^'"]+)['"]/)?.[1];
    const title =
      block.match(/title:\s*"([^"]*)"/)?.[1] ??
      block.match(/title:\s*'([^']*)'/)?.[1] ??
      '';
    const desc =
      block.match(/description:\s*"((?:\\.|[^"\\])*)"/)?.[1] ??
      block.match(/description:\s*'((?:\\.|[^'\\])*)'/)?.[1];
    const group =
      block.match(/questionGroup:\s*['"]([^'"]+)['"]/)?.[1] ?? '';

    if (desc) {
      items.push({
        id: id ?? '',
        title: unescape(title),
        description: unescape(desc),
        group,
      });
    }
  }
  return items;
}

const all = [];

for (const src of SOURCES) {
  const content = readFileSync(join(root, src.file), 'utf8');
  const items =
    src.file.includes('matureContent')
      ? extractFromSource(content, true)
      : extractFromSource(content);
  all.push({ ...src, items });
}

const total = all.reduce((n, s) => n + s.items.length, 0);

const lines = [
  '══════════════════════════════════════════',
  '  ספין זוגי — כל השאלות',
  `  סה"כ: ${total} שאלות`,
  '══════════════════════════════════════════',
  '',
];

for (const section of all) {
  lines.push('──────────────────────────────────────────');
  lines.push(`  ${section.label} (${section.items.length})`);
  lines.push('──────────────────────────────────────────');
  lines.push('');

  let prevTitle = '';
  section.items.forEach((q, i) => {
    if (q.title && q.title !== prevTitle) {
      lines.push(`【 ${q.title} 】`);
      lines.push('');
      prevTitle = q.title;
    }
    lines.push(`${i + 1}. ${q.description}`);
    lines.push('');
  });
}

lines.push('══════════════════════════════════════════');
lines.push('  סוף הקובץ');
lines.push('══════════════════════════════════════════');
lines.push('');

const outIndex = process.argv.indexOf('--out');
if (outIndex !== -1 && !process.argv[outIndex + 1]) throw new Error('Missing --out path');
const outPath = outIndex === -1 ? join(root, 'שאלות.txt') : process.argv[outIndex + 1];
writeFileSync(outPath, lines.join('\n'), 'utf8');
console.log(`✓ נוצר: ${outPath}`);
console.log(`  ${total} שאלות`);
