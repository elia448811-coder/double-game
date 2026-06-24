#!/usr/bin/env node
/**
 * בדיקת מערכת מקיפה — ספין זוגי
 * מריץ: lint, בדיקות יחידה, אימות נתונים, TypeScript, ובנייה.
 *
 * שימוש: npm run test:system
 *         node scripts/test-system.mjs
 *         TEST.bat
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const results = [];

function runStep(name, cmd, optional = false, env = process.env) {
  const start = Date.now();
  process.stdout.write(`\n▶ ${name}...\n`);
  try {
    execSync(cmd, { stdio: 'inherit', cwd: root, encoding: 'utf8', env });
    const ms = Date.now() - start;
    results.push({ name, ok: true, ms });
    return true;
  } catch {
    const ms = Date.now() - start;
    results.push({ name, ok: false, ms });
    if (!optional) return false;
    return true;
  }
}

function validateDataFiles() {
  process.stdout.write('\n▶ אימות קבצי נתונים...\n');
  const errors = [];

  const questionsJson = join(root, 'scripts', 'questions-texts.json');
  if (!existsSync(questionsJson)) {
    errors.push('חסר scripts/questions-texts.json');
  } else {
    const texts = JSON.parse(readFileSync(questionsJson, 'utf8'));
    if (texts.length !== 300) errors.push(`questions-texts.json: צפוי 300, קיבל ${texts.length}`);
    const empty = texts.filter((t) => !t || String(t).trim().length < 5);
    if (empty.length) errors.push(`${empty.length} שאלות ריקות או קצרות מדי`);
  }

  const allQuestionsTs = join(root, 'src', 'data', 'allQuestions.ts');
  if (!existsSync(allQuestionsTs)) {
    errors.push('חסר src/data/allQuestions.ts');
  } else {
    const src = readFileSync(allQuestionsTs, 'utf8');
    const count = (src.match(/id: 'q-/g) || []).length;
    if (count !== 300) errors.push(`allQuestions.ts: צפוי 300, קיבל ${count}`);
  }

  const allTasksTs = join(root, 'src', 'data', 'allTasks.ts');
  const coupleTasksTs = join(root, 'src', 'data', 'coupleTasks.ts');
  if (!existsSync(allTasksTs) || !existsSync(coupleTasksTs)) {
    errors.push('חסר קובץ משימות');
  } else {
    const extraCount = (readFileSync(allTasksTs, 'utf8').match(/extraTasks/g) || []).length;
    const coupleCount = (readFileSync(coupleTasksTs, 'utf8').match(/id: '/g) || []).length;
    if (coupleCount < 100 || extraCount < 1) {
      errors.push(`מאגר משימות: coupleTasks=${coupleCount}, extra=${extraCount}`);
    }
  }

  const requiredScreens = [
    'src/screens/WelcomeScreen.tsx',
    'src/screens/QuickSetupScreen.tsx',
    'src/screens/DiceRollScreen.tsx',
    'src/screens/GameScreen.tsx',
    'src/screens/EndScreen.tsx',
    'src/screens/SettingsScreen.tsx',
  ];
  for (const f of requiredScreens) {
    if (!existsSync(join(root, f))) errors.push(`חסר מסך: ${f}`);
  }

  const requiredComponents = [
    'src/components/TaskModal.tsx',
    'src/components/SpinnerWheel.tsx',
    'src/components/MiniRobot.tsx',
    'src/components/AgeGateModal.tsx',
  ];
  for (const f of requiredComponents) {
    if (!existsSync(join(root, f))) errors.push(`חסר רכיב: ${f}`);
  }

  if (errors.length) {
    for (const e of errors) console.error(`  ✗ ${e}`);
    results.push({ name: 'אימות נתונים', ok: false, ms: 0 });
    return false;
  }

  console.log('  ✓ 300 שאלות, משימות, מסכים ורכיבים — תקין');
  results.push({ name: 'אימות נתונים', ok: true, ms: 0 });
  return true;
}

console.log('╔══════════════════════════════════════════╗');
console.log('║   ספין זוגי — בדיקת מערכת מקיפה         ║');
console.log('╚══════════════════════════════════════════╝');

const startAll = Date.now();
let allOk = true;

if (!validateDataFiles()) allOk = false;
if (!runStep('Lint (oxlint)', 'npm run lint')) allOk = false;
if (!runStep('בדיקות יחידה (Vitest)', 'npm run test')) allOk = false;
if (!runStep('בדיקות מובייל + iPad', 'npm run test:layouts')) allOk = false;
if (!runStep('TypeScript', 'npx tsc -b --pretty false')) allOk = false;
if (!runStep('בניית production', 'npm run build')) allOk = false;

const distIndex = join(root, 'dist', 'index.html');
if (!existsSync(distIndex)) {
  console.error('\n✗ dist/index.html חסר אחרי build');
  allOk = false;
} else {
  console.log('\n  ✓ dist/index.html קיים');
}

const totalMs = Date.now() - startAll;

console.log('\n╔══════════════════════════════════════════╗');
console.log('║              סיכום בדיקות                ║');
console.log('╚══════════════════════════════════════════╝\n');

for (const r of results) {
  const icon = r.ok ? '✓' : '✗';
  const time = r.ms ? ` (${(r.ms / 1000).toFixed(1)}s)` : '';
  console.log(`  ${icon} ${r.name}${time}`);
}

console.log(`\n  זמן כולל: ${(totalMs / 1000).toFixed(1)} שניות`);

if (allOk) {
  console.log('\n  ✅ כל הבדיקות עברו בהצלחה!\n');
  process.exit(0);
} else {
  console.log('\n  ❌ נכשלו בדיקות — ראה פירוט למעלה.\n');
  process.exit(1);
}
