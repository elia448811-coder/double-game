import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/e2e/fixtures/game.html');
  await page.waitForFunction(() => typeof window.auditSeed === 'function');
});

test('difficulty buttons choose the right level and explain unavailable alternatives', async ({ page }) => {
  await page.evaluate(() => window.auditSeed());
  await expect(page.locator('.task-modal')).toBeVisible();
  await page.getByRole('button', { name: /עוד אפשרויות/ }).click();
  await page.getByRole('button', { name: 'קל מדי', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.audit.game.currentTask?.level)).toBe('normal');
  await page.getByRole('button', { name: /עוד אפשרויות/ }).click();
  await page.getByRole('button', { name: 'קל מדי', exact: true }).click();
  await expect(page.getByText('אין כרגע משימה קשה יותר שמתאימה לבחירות שלכם.')).toBeVisible();
  await page.getByRole('button', { name: 'קשה מדי', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.audit.game.currentTask?.level)).toBe('easy');
});

test('StrictMode double completion scores once and undo restores the card', async ({ page }) => {
  await page.evaluate(() => window.auditSeed());
  await page.evaluate(() => { window.audit.completeTask(); window.audit.completeTask(); });
  await expect.poll(() => page.evaluate(() => window.audit.game.stats.totalCompleted)).toBe(1);
  await expect.poll(() => page.evaluate(() => window.audit.game.cooperativeScore)).toBe(1);
  await page.getByRole('button', { name: 'בטל פעולה' }).click();
  await expect(page.locator('.task-modal')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.audit.game.stats.totalCompleted)).toBe(0);
});

test('timer survives a long pause and expires once after resuming', async ({ page }) => {
  await page.evaluate(() => { window.auditSeed(true); });
  await expect(page.locator('.game-screen')).toBeVisible();
  await page.getByRole('button', { name: 'השהייה' }).click();
  await page.waitForTimeout(3500);
  await expect.poll(() => page.evaluate(() => window.audit.game.screen)).toBe('game');
  await expect.poll(() => page.evaluate(() => window.audit.game.timeRemainingSeconds)).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'המשך', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.audit.game.screen), { timeout: 5000 }).toBe('end');
  const finish = await page.evaluate(() => window.audit.game.finishEventId);
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => window.audit.game.finishEventId)).toBe(finish);
});

test('corrupt session data safely falls back to the home screen', async ({ page }) => {
  await page.evaluate(() => sessionStorage.setItem('couple-spin-active-game', '{"screen":"game"}'));
  await page.reload();
  await page.waitForFunction(() => typeof window.auditSeed === 'function');
  await expect.poll(() => page.evaluate(() => window.audit.game.screen)).toBe('welcome');
});

test('timer stores elapsed time so a reload cannot reset the countdown', async ({ page }) => {
  await page.evaluate(() => window.auditSeed(true));
  await expect.poll(() => page.evaluate(() => {
    const saved = sessionStorage.getItem('couple-spin-active-game');
    return saved ? JSON.parse(saved).timeRemainingSeconds : null;
  }), { timeout: 2500 }).toBe(2);
  await page.reload();
  await page.waitForFunction(() => typeof window.auditSeed === 'function');
  await expect.poll(() => page.evaluate(() => window.audit.game.timeRemainingSeconds)).toBeLessThanOrEqual(2);
});

test('resetting scores clears undo and saves the reset state for a reload', async ({ page }) => {
  await page.evaluate(() => window.auditSeed());
  await page.evaluate(() => window.audit.completeTask());
  await expect.poll(() => page.evaluate(() => window.audit.game.cooperativeScore)).toBe(1);
  await page.evaluate(() => window.audit.resetScores());
  await expect.poll(() => page.evaluate(() => window.audit.game.cooperativeScore)).toBe(0);
  await expect(page.getByRole('button', { name: 'בטל פעולה' })).toHaveCount(0);
  await page.reload();
  await page.waitForFunction(() => typeof window.auditSeed === 'function');
  await expect.poll(() => page.evaluate(() => window.audit.game.cooperativeScore)).toBe(0);
});
