#!/usr/bin/env node
/**
 * בדיקה שההפצה ב-GitHub Pages עלתה תקין.
 * שימוש: node scripts/verify-deploy.mjs
 */
import { execSync } from 'node:child_process';

const BASE = (process.env.DEPLOY_URL || 'https://elia448811-coder.github.io/double-game').replace(/\/$/, '');
const errors = [];
const notes = [];

function ok(msg) {
  notes.push(msg);
}

function fail(msg) {
  errors.push(msg);
}

async function fetchText(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  return { res, text: await res.text() };
}

let headSha = '';
try {
  headSha = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
} catch {
  /* not in git */
}

console.log(`▶ בדיקת הפצה: ${BASE}\n`);

try {
  const { res, text } = await fetchText(`${BASE}/`);
  if (res.status !== 200) fail(`דף ראשי: HTTP ${res.status}`);
  else ok(`דף ראשי: HTTP 200 (${text.length} bytes)`);

  if (!text.includes('id="root"')) fail('חסר #root ב-index.html');
  else ok('index.html מכיל #root');

  const jsMatch = text.match(/assets\/index-([A-Za-z0-9_-]+)\.js/);
  if (!jsMatch) fail('לא נמצא bundle JS ב-index.html');
  else {
    const jsUrl = `${BASE}/assets/index-${jsMatch[1]}.js`;
    const jsRes = await fetch(jsUrl, { signal: AbortSignal.timeout(15000) });
    if (!jsRes.ok) fail(`bundle JS: HTTP ${jsRes.status}`);
    else ok(`bundle JS נטען: index-${jsMatch[1]}.js`);

    const cssMatch = text.match(/assets\/index-([A-Za-z0-9_-]+)\.css/);
    if (cssMatch) {
      const cssRes = await fetch(`${BASE}/assets/index-${cssMatch[1]}.css`, {
        signal: AbortSignal.timeout(15000),
      });
      if (!cssRes.ok) fail(`CSS: HTTP ${cssRes.status}`);
      else ok(`CSS נטען: index-${cssMatch[1]}.css`);
    }
  }

  const swRes = await fetch(`${BASE}/sw.js`, { signal: AbortSignal.timeout(15000) });
  if (!swRes.ok) fail(`service worker: HTTP ${swRes.status}`);
  else ok('service worker (sw.js) זמין');

  const manifestRes = await fetch(`${BASE}/manifest.webmanifest`, { signal: AbortSignal.timeout(15000) });
  if (!manifestRes.ok) fail(`manifest: HTTP ${manifestRes.status}`);
  else ok('PWA manifest זמין');
} catch (e) {
  fail(`שגיאת רשת: ${e.message}`);
}

if (headSha) ok(`commit מקומי: ${headSha}`);

for (const n of notes) console.log(`  ✓ ${n}`);
if (errors.length) {
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log('\n  ✅ ההפצה החיה נראית תקינה\n');
