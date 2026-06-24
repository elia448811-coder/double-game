import { execSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

function run(cmd) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: root });
}

function walkSync(dir, total) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) walkSync(p, total);
    else total.bytes += statSync(p).size;
  }
  return total;
}

console.log('========================================');
console.log('  ספין זוגי — בניית גרסת הפצה');
console.log('========================================');

run('npm run test');
run('npm run build');

const distPath = join(root, 'dist');
if (!existsSync(distPath) || !existsSync(join(distPath, 'index.html'))) {
  console.error('\n[שגיאה] הבנייה נכשלה — dist/index.html חסר.');
  process.exit(1);
}

const { bytes } = walkSync(distPath, { bytes: 0 });

console.log('\n========================================');
console.log('  הבנייה הושלמה בהצלחה');
console.log('========================================');
console.log(`  תיקייה: ${distPath}`);
console.log(`  גודל:   ${(bytes / 1024).toFixed(1)} KB`);
console.log('\n  העלה את תוכן dist/ לשרת האחסון.');
console.log('  או חבר את הריפו ל-Netlify / Vercel / Cloudflare Pages.');
console.log('========================================\n');
