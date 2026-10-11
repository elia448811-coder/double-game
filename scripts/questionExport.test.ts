import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { expect, it } from 'vitest';
import { builtInContent } from '../src/data/allContent';

it('exports every built-in question once, including mature questions, without tasks', () => {
  const temp = mkdtempSync(join(tmpdir(), 'couple-question-export-'));
  try {
    const output = join(temp, 'questions.txt');
    execFileSync(process.execPath, ['scripts/export-questions.mjs', '--out', output]);
    const text = readFileSync(output, 'utf8');
    const lines = text.split('\n').filter(line => /^\d+\. /.test(line)).map(line => line.replace(/^\d+\. /, ''));
    const expected = builtInContent.filter(item => item.kind === 'question').map(item => item.description);
    expect(lines).toEqual(expected);
    expect(text).toContain('432 שאלות');
    const bank = readFileSync('ספין-זוגי-שאלות-ומשימות-משופר-18plus.txt', 'utf8');
    for (const question of expected) expect(bank).toContain(question);
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});

