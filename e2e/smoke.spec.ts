import { expect, test, type Page } from '@playwright/test';

async function home(page: Page) {
  await page.addInitScript(() => localStorage.setItem('couple-spin-onboarding-done', '1'));
  await page.goto('/');
  await expect(page.locator('.hub-screen')).toBeVisible();
}
async function startQuestions(page: Page) {
  await home(page);
  await page.getByRole('button', { name: /בואו נתחיל/ }).click();
  await page.getByText('שאלות', { exact: true }).click();
  await page.getByLabel('שם שחקן 1').fill('אליה');
  await page.getByLabel('שם שחקן 2').fill('נועה');
  await page.getByRole('button', { name: 'הכל מוכן — ממשיכים' }).click();
  await page.getByRole('button', { name: /דלגו על הקובייה/ }).click();
  await expect(page.locator('.game-screen')).toBeVisible();
}
async function fits(page: Page) {
  const sizes = await page.evaluate(() => [innerWidth, document.documentElement.scrollWidth]);
  expect(sizes[1]).toBeLessThanOrEqual(sizes[0] + 1);
}

test('layouts: questions, replacement, undo, settings, resume, restart and finish', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await startQuestions(page);
  await fits(page);
  const wheel = await page.locator('.wheel').boundingBox();
  const center = await page.locator('.wheel-center').boundingBox();
  expect(Math.abs((center!.x + center!.width / 2) - (wheel!.x + wheel!.width / 2))).toBeLessThan(1);
  expect(Math.abs((center!.y + center!.height / 2) - (wheel!.y + wheel!.height / 2))).toBeLessThan(1);
  const spin = page.getByRole('button', { name: 'סובב את הגלגל' });
  await spin.click();
  await expect(spin).toBeDisabled();
  const modal = page.locator('.task-modal');
  await expect(modal).toBeVisible();
  await fits(page);
  const first = await page.locator('#task-modal-title').innerText();
  await page.getByRole('button', { name: /עוד אפשרויות/ }).click();
  await page.getByRole('button', { name: /מועדפים/ }).click();
  await page.getByRole('button', { name: /שאלה אחרת/ }).click();
  await expect(page.locator('#task-modal-title')).not.toHaveText(first);
  await page.getByRole('button', { name: /דיברנו על זה/ }).click();
  await expect(modal).toBeHidden();
  await page.getByRole('button', { name: 'בטל פעולה' }).click();
  await expect(modal).toBeVisible();
  await page.getByRole('button', { name: /דיברנו על זה/ }).click();
  await page.getByRole('button', { name: 'השהייה' }).click();
  const pauseBox = await page.getByRole('dialog').boundingBox();
  expect(pauseBox!.y).toBeGreaterThanOrEqual(0);
  expect(pauseBox!.y + pauseBox!.height).toBeLessThanOrEqual(page.viewportSize()!.height + 1);
  await page.getByRole('button', { name: 'הגדרות', exact: true }).click();
  await expect(page.locator('.settings-screen')).toBeVisible();
  await fits(page);
  await page.getByRole('button', { name: 'חזרה', exact: true }).click();
  await expect(page.locator('.game-screen')).toBeVisible();
  await expect(page.getByText('קחו רגע', { exact: true })).toBeHidden();
  await page.getByRole('button', { name: 'השהייה' }).click();
  await page.getByRole('button', { name: 'יציאה', exact: true }).click();
  await expect(page.locator('.hub-screen')).toBeVisible();
  await page.getByRole('button', { name: 'המשך משחק מקומי' }).click();
  await expect(spin).toBeEnabled();
  await page.getByRole('button', { name: 'השהייה' }).click();
  await page.getByRole('button', { name: 'התחלה מחדש' }).click();
  await expect(page.locator('.dice-screen')).toBeVisible();
  await expect(page.getByRole('button', { name: 'בטל פעולה' })).toHaveCount(0);
  await page.getByRole('button', { name: /דלגו על הקובייה/ }).click();
  await page.getByRole('button', { name: 'סיום משחק', exact: true }).click();
  await page.getByRole('button', { name: 'כן, סיימו' }).click();
  await expect(page.locator('.end-screen')).toBeVisible();
  await fits(page);
  await page.getByRole('radio', { name: '4 מתוך 5' }).click();
  await expect(page.getByRole('radio', { name: '4 מתוך 5' })).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('button', { name: /שחקו שוב/ }).click();
  await expect(page.locator('.dice-screen')).toBeVisible();
  expect(errors).toEqual([]);
});

test('cancelled spin cannot create a question; reload resumes an unlocked game', async ({ page }) => {
  await startQuestions(page);
  await page.getByRole('button', { name: 'סובב את הגלגל' }).click();
  await page.getByRole('button', { name: 'השהייה' }).click();
  await page.getByRole('button', { name: 'יציאה', exact: true }).click();
  await page.waitForTimeout(4200);
  await expect(page.locator('.hub-screen')).toBeVisible();
  await page.getByRole('button', { name: 'המשך משחק מקומי' }).click();
  await expect(page.locator('.task-modal')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'סובב את הגלגל' })).toBeEnabled();
  await page.reload();
  await expect(page.locator('.game-screen')).toBeVisible();
  await expect(page.getByRole('button', { name: 'סובב את הגלגל' })).toBeEnabled();
});

test('layouts: age confirmation, consent, robot and orientation changes', async ({ page }) => {
  await home(page);
  await page.getByRole('button', { name: /בואו נתחיל/ }).click();
  await page.getByRole('button', { name: /18\+/ }).first().click();
  await page.getByRole('button', { name: 'הכל מוכן — ממשיכים' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await fits(page);
  await page.getByRole('button', { name: 'אנחנו מעל 18 — המשך' }).click();
  await expect(page.locator('.consent-bounds-panel')).toBeVisible();
  await fits(page);
  await page.getByRole('button', { name: 'אישור והמשך' }).click();
  await expect(page.locator('.dice-screen')).toBeVisible();
  await page.getByRole('button', { name: /פתח את ספינבי/ }).click();
  await expect(page.locator('.mini-robot__panel')).toBeVisible();
  const robotBox = await page.locator('.mini-robot__panel').boundingBox();
  expect(robotBox!.x).toBeGreaterThanOrEqual(0);
  expect(robotBox!.y).toBeGreaterThanOrEqual(0);
  expect(robotBox!.x + robotBox!.width).toBeLessThanOrEqual(page.viewportSize()!.width + 1);
  await page.getByLabel('שאלה לספינבי').fill('איך משחקים?');
  await page.locator('.mini-robot__panel').getByRole('button', { name: 'שלח', exact: true }).click();
  await fits(page);
  const view = page.viewportSize()!;
  await page.setViewportSize({ width: view.height, height: view.width });
  await fits(page);
  await expect(page.locator('html')).toHaveAttribute('data-orientation', view.width < view.height ? 'landscape' : 'portrait');
  await page.getByRole('button', { name: 'סגור', exact: true }).click();
});
