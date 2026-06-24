#!/usr/bin/env node
/**
 * בדיקת מצבי תצוגה — מובייל + iPad
 * מריץ: אימות CSS, יחידות, ובדיקות דפדפן (Playwright) ב-viewports אמיתיים.
 *
 * שימוש: npm run test:layouts
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(import.meta.url), '..', '..');
const distDir = join(root, 'dist');
const buildEnv = { ...process.env, PASS_W: '' };
const results = [];

function pass(name, detail = '') {
  results.push({ ok: true, name, detail });
  console.log(`  ✓ ${name}${detail ? ` — ${detail}` : ''}`);
}

function fail(name, detail = '') {
  results.push({ ok: false, name, detail });
  console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
}

function read(path) {
  return readFileSync(join(root, path), 'utf8');
}

/* ── 1. Wiring & files ── */

function validateWiring() {
  console.log('\n▶ חיווט וקבצים...');
  let ok = true;

  const app = read('src/app/App.tsx');
  if (!app.includes('useDeviceLayout')) {
    fail('App.tsx', 'חסר useDeviceLayout');
    ok = false;
  } else pass('App.tsx', 'useDeviceLayout מחובר');

  if (!app.includes("import '../styles/responsive.css'")) {
    fail('App.tsx', 'חסר import responsive.css');
    ok = false;
  } else pass('responsive.css', 'מיובא ב-App');

  if (!existsSync(join(root, 'src/hooks/useDeviceLayout.ts'))) {
    fail('useDeviceLayout.ts', 'חסר');
    ok = false;
  } else pass('useDeviceLayout.ts', 'קיים');

  if (!existsSync(join(root, 'src/styles/responsive.css'))) {
    fail('responsive.css', 'חסר');
    ok = false;
  } else pass('responsive.css', 'קיים');

  return ok;
}

/* ── 2. CSS coverage ── */

const MOBILE_REQUIRED = [
  '.setup-footer',
  '.wheel-frame',
  '.modal-backdrop',
  '.task-modal',
  '.preset-row',
  '.name-row',
  '.game-screen',
  '.dice-screen',
];

const TABLET_REQUIRED = [
  '.setup-footer',
  '.wheel-frame',
  '.welcome-hero__steps',
  '.end-stats-grid',
  '.game-screen',
  '.dice-face',
  '.mini-robot',
];

function validateCssCoverage() {
  console.log('\n▶ כיסוי CSS למובייל ו-iPad...');
  const css = read('src/styles/responsive.css');
  let ok = true;

  for (const device of ['mobile', 'tablet']) {
    const re = new RegExp(`html\\[data-device='${device}'\\]`, 'g');
    const count = (css.match(re) || []).length;
    if (count < 10) {
      fail(`כללי ${device}`, `רק ${count} כללים — צפוי ≥10`);
      ok = false;
    } else {
      pass(`כללי ${device}`, `${count} כללים`);
    }
  }

  for (const sel of MOBILE_REQUIRED) {
    const hit =
      css.includes(`html[data-device='mobile'] ${sel}`) ||
      (sel === '.task-modal' && css.includes("html[data-device='mobile'] .task-modal--clean"));
    if (!hit) {
      fail('CSS mobile', `חסר כלל ל-${sel}`);
      ok = false;
    }
  }
  if (ok) pass('רכיבי mobile', `${MOBILE_REQUIRED.length} רכיבים`);

  let tabletOk = true;
  for (const sel of TABLET_REQUIRED) {
    if (!css.includes(`html[data-device='tablet'] ${sel}`)) {
      fail('CSS tablet', `חסר כלל ל-${sel}`);
      tabletOk = false;
      ok = false;
    }
  }
  if (tabletOk) pass('רכיבי tablet', `${TABLET_REQUIRED.length} רכיבים`);

  const vars = ['--layout-card-max', '--layout-wheel-size', '--layout-safe-bottom'];
  for (const v of vars) {
    if (!css.includes(v)) {
      fail('CSS variables', `חסר ${v}`);
      ok = false;
    }
  }
  if (ok) pass('CSS variables', vars.join(', '));

  if (css.includes('100dvh')) pass('100dvh', 'גובה מסך מלא');
  else {
    fail('100dvh', 'חסר');
    ok = false;
  }

  return ok;
}

/* ── 3. Vitest unit tests ── */

function runUnitTests() {
  console.log('\n▶ בדיקות יחידה (viewports)...');
  try {
    execSync('npx vitest run src/utils/deviceLayout.test.ts src/utils/responsiveLayout.test.ts', {
      cwd: root,
      stdio: 'inherit',
      encoding: 'utf8',
    });
    pass('Vitest', 'כל תרחישי viewport');
    return true;
  } catch {
    fail('Vitest', 'נכשל');
    return false;
  }
}

/* ── 4. Static file server for E2E ── */

function contentType(file) {
  if (file.endsWith('.html')) return 'text/html; charset=utf-8';
  if (file.endsWith('.js')) return 'application/javascript';
  if (file.endsWith('.css')) return 'text/css';
  if (file.endsWith('.json')) return 'application/json';
  if (file.endsWith('.svg')) return 'image/svg+xml';
  if (file.endsWith('.webmanifest')) return 'application/manifest+json';
  return 'application/octet-stream';
}

function startStaticServer(port) {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      let path = req.url?.split('?')[0] ?? '/';
      if (path === '/') path = '/index.html';
      const filePath = join(distDir, path.replace(/^\//, ''));
      if (!existsSync(filePath)) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(readFileSync(join(distDir, 'index.html')));
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType(filePath) });
      res.end(readFileSync(filePath));
    });
    server.on('error', reject);
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

/* ── 5. Playwright browser tests ── */

const VIEWPORTS = [
  { id: 'iphone-se', label: 'iPhone SE', width: 375, height: 667, device: 'mobile', orientation: 'portrait' },
  { id: 'iphone-14', label: 'iPhone 14', width: 390, height: 844, device: 'mobile', orientation: 'portrait' },
  { id: 'iphone-landscape', label: 'iPhone landscape', width: 844, height: 390, device: 'mobile', orientation: 'landscape' },
  { id: 'ipad-mini', label: 'iPad Mini', width: 768, height: 1024, device: 'tablet', orientation: 'portrait' },
  { id: 'ipad-air', label: 'iPad Air', width: 820, height: 1180, device: 'tablet', orientation: 'portrait' },
  { id: 'ipad-landscape', label: 'iPad landscape', width: 1180, height: 820, device: 'tablet', orientation: 'landscape' },
  { id: 'ipad-pro-12', label: 'iPad Pro 12.9"', width: 1024, height: 1366, device: 'tablet', orientation: 'portrait' },
];

async function runBrowserTests(baseUrl) {
  console.log('\n▶ בדיקות דפדפן (Playwright)...');
  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    console.log('  ⚠ Playwright לא מותקן — מדלג על בדיקות דפדפן (npm install -D playwright)');
    return null;
  }

  const browser = await chromium.launch({ headless: true });
  let ok = true;

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.device === 'mobile',
      hasTouch: true,
      locale: 'he-IL',
    });
    const page = await context.newPage();
    const tag = `${vp.label} (${vp.width}×${vp.height})`;

    try {
      await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(300);

      const attrs = await page.evaluate(() => ({
        device: document.documentElement.dataset.device,
        orientation: document.documentElement.dataset.orientation,
        touch: document.documentElement.dataset.touch,
      }));

      if (attrs.device !== vp.device) {
        fail(tag, `data-device="${attrs.device}" צפוי "${vp.device}"`);
        ok = false;
        await context.close();
        continue;
      }

      if (attrs.orientation !== vp.orientation) {
        fail(tag, `data-orientation="${attrs.orientation}" צפוי "${vp.orientation}"`);
        ok = false;
        await context.close();
        continue;
      }

      const layout = await page.evaluate(() => {
        const root = document.documentElement;
        const style = getComputedStyle(root);
        return {
          cardMax: style.getPropertyValue('--layout-card-max').trim(),
          wheelSize: style.getPropertyValue('--layout-wheel-size').trim(),
          overflowX: document.documentElement.scrollWidth > window.innerWidth + 2,
          welcomeVisible: !!document.querySelector('.welcome-hero'),
          ctaVisible: !!document.querySelector('.cta-button--hero'),
        };
      });

      if (!layout.welcomeVisible || !layout.ctaVisible) {
        fail(tag, 'מסך welcome לא נטען');
        ok = false;
        await context.close();
        continue;
      }

      if (layout.overflowX) {
        fail(tag, 'גלילה אופקית — overflow');
        ok = false;
        await context.close();
        continue;
      }

      if (!layout.cardMax || !layout.wheelSize) {
        fail(tag, 'CSS variables לא הוגדרו');
        ok = false;
        await context.close();
        continue;
      }

      await page.click('.cta-button--hero');
      await page.waitForSelector('.setup-screen', { timeout: 5000 });

      const setup = await page.evaluate(() => {
        const footer = document.querySelector('.setup-footer');
        const footerStyle = footer ? getComputedStyle(footer) : null;
        return {
          overflowX: document.documentElement.scrollWidth > window.innerWidth + 2,
          footerPosition: footerStyle?.position ?? '',
          setupVisible: !!document.querySelector('.setup-card'),
          chipsVisible: document.querySelectorAll('.choice-chip').length >= 6,
        };
      });

      if (!setup.setupVisible || !setup.chipsVisible) {
        fail(tag, 'מסך setup לא תקין');
        ok = false;
        await context.close();
        continue;
      }

      if (setup.overflowX) {
        fail(tag, 'setup — overflow אופקי');
        ok = false;
        await context.close();
        continue;
      }

      if (vp.device === 'mobile' && setup.footerPosition !== 'fixed') {
        fail(tag, `setup footer צפוי fixed, קיבל ${setup.footerPosition}`);
        ok = false;
        await context.close();
        continue;
      }

      if (vp.device === 'tablet' && setup.footerPosition === 'fixed') {
        fail(tag, 'setup footer ב-iPad לא צריך להיות fixed');
        ok = false;
        await context.close();
        continue;
      }

      await page.click('.icon-btn');
      await page.waitForSelector('.welcome-screen', { timeout: 5000 });

      const afterBack = await page.evaluate(() => ({
        overflowX: document.documentElement.scrollWidth > window.innerWidth + 2,
        device: document.documentElement.dataset.device,
      }));

      if (afterBack.device !== vp.device) {
        fail(tag, 'data-device השתנה אחרי ניווט');
        ok = false;
      } else if (afterBack.overflowX) {
        fail(tag, 'overflow אחרי חזרה');
        ok = false;
      } else {
        pass(tag, `device=${attrs.device} · vars OK · setup OK`);
      }
    } catch (err) {
      fail(tag, err instanceof Error ? err.message : String(err));
      ok = false;
    }

    await context.close();
  }

  await browser.close();
  return ok;
}

/* ── Main ── */

async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   בדיקת מצבים — מובייל + iPad           ║');
  console.log('╚══════════════════════════════════════════╝');

  const start = Date.now();
  let allOk = true;

  if (!validateWiring()) allOk = false;
  if (!validateCssCoverage()) allOk = false;
  if (!runUnitTests()) allOk = false;

  if (!existsSync(join(distDir, 'index.html'))) {
    console.log('\n▶ בונה production...');
    try {
      execSync('npm run build', { cwd: root, stdio: 'inherit', env: buildEnv });
    } catch {
      fail('build', 'נכשל');
      allOk = false;
    }
  } else {
    console.log('\n▶ מרענן build (קוד layout עודכן)...');
    try {
      execSync('npm run build', { cwd: root, stdio: 'inherit', env: buildEnv });
    } catch {
      fail('build', 'נכשל');
      allOk = false;
    }
  }

  if (existsSync(join(distDir, 'index.html'))) {
    const port = 4173 + Math.floor(Math.random() * 100);
    const baseUrl = `http://127.0.0.1:${port}`;
    console.log(`\n▶ שרת מקומי ${baseUrl}...`);
    const server = await startStaticServer(port);
    try {
      const browserOk = await runBrowserTests(baseUrl);
      if (browserOk === false) allOk = false;
      else if (browserOk === true) pass('Playwright', `${VIEWPORTS.length} viewports`);
    } finally {
      server.close();
    }
  }

  const ms = Date.now() - start;
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;

  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║              סיכום                       ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`\n  ✓ ${passed} עברו · ✗ ${failed} נכשלו · ${(ms / 1000).toFixed(1)}s\n`);

  if (allOk) {
    console.log('  ✅ מובייל ו-iPad — כל הבדיקות עברו!\n');
    process.exit(0);
  } else {
    console.log('  ❌ נמצאו בעיות — ראה פירוט למעלה.\n');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
