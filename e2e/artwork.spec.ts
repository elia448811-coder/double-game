import { expect, test } from '@playwright/test';

test('layouts: artwork loads on home and mood choices without horizontal overflow', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('couple-spin-onboarding-done', '1'));
  await page.goto('/');
  const hero = page.locator('.content-artwork--hero img');
  await expect(hero).toBeVisible();
  await expect.poll(() => hero.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  await page.getByRole('button', { name: /בואו נתחיל/ }).click();
  const options = page.locator('.option-card--illustrated');
  await expect(options).toHaveCount(6);
  for (const option of await options.all()) {
    await option.scrollIntoViewIfNeeded();
    await expect.poll(() => option.locator('img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test('layouts: a replacement changes its illustration and long cards remain usable', async ({ page }) => {
  await page.goto('/e2e/fixtures/game.html');
  await page.waitForFunction(() => typeof window.auditSeed === 'function');
  await page.evaluate(() => window.auditSeed());
  await expect(page.locator('.task-modal')).toBeVisible();
  const show = async (description: string) => page.evaluate((description) => {
    window.audit.applyRemoteSnapshot({ ...window.audit.game,
      currentTask: { id: description, title: 'שאלה', description, kind: 'question', category: 'romantic', level: 'easy', questionGroup: 'deep' },
    }, Date.now());
  }, description);
  await show('לאן היית רוצה שנצא לטיול?');
  await expect(page.locator('.content-artwork--card')).toHaveAttribute('data-artwork', 'adventure');
  await expect.poll(() => page.locator('.content-artwork--card img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  await show('מה עוזר לך להירגע בזמן לחץ?');
  await expect(page.locator('.content-artwork--card')).toHaveAttribute('data-artwork', 'calm');
  await show('איזה דבר חשוב לך שנדע זה על זו? '.repeat(12));
  await page.getByRole('button', { name: /עוד אפשרויות/ }).click();
  const modal = await page.locator('.task-modal').boundingBox();
  expect(modal!.y).toBeGreaterThanOrEqual(0);
  expect(modal!.y + modal!.height).toBeLessThanOrEqual(page.viewportSize()!.height + 1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.getByRole('button', { name: /דיברנו על זה/ }).click();
  await expect(page.locator('.task-modal')).toBeHidden();
});

test('an unavailable illustration never blocks the question or its actions', async ({ page }) => {
  await page.route('**/*.webp*', (route) => route.request().resourceType() === 'image' ? route.abort() : route.continue());
  await page.goto('/e2e/fixtures/game.html');
  await page.waitForFunction(() => typeof window.auditSeed === 'function');
  await page.evaluate(() => window.auditSeed());
  await expect(page.locator('.task-modal')).toBeVisible();
  await expect(page.locator('.content-artwork--card')).toHaveCount(0);
  await page.getByRole('button', { name: '✓ בוצע', exact: true }).click();
  await expect(page.locator('.task-modal')).toBeHidden();
});
