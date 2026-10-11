import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/e2e/fixtures/game.html');
  await page.waitForFunction(() => typeof window.auditSeed === 'function');
  await page.evaluate(() => { window.auditSeed(); window.audit.endGame(); });
  await expect(page.locator('.end-screen')).toBeVisible();
});

test('evening rating supports RTL arrows, Home and End and persists the choice', async ({ page }) => {
  const group = page.getByRole('radiogroup', { name: 'דירוג הערב' });
  const first = group.getByRole('radio', { name: '1 מתוך 5' });
  await first.focus();
  await page.keyboard.press('End');
  const last = group.getByRole('radio', { name: '5 מתוך 5' });
  await expect(last).toBeFocused();
  await expect(last).toHaveAttribute('aria-checked', 'true');
  await page.keyboard.press('ArrowRight');
  await expect(group.getByRole('radio', { name: '4 מתוך 5' })).toBeFocused();
  await page.keyboard.press('Home');
  await expect(first).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByText('תודה! שמרנו את הדירוג (1/5)', { exact: true })).toBeVisible();
});

for (const canceled of [true, false]) {
  test(`native sharing ${canceled ? 'cancellation is silent' : 'failure explains the fallback'}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.evaluate((canceled) => {
      Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => false });
      Object.defineProperty(navigator, 'share', { configurable: true, value: async () => {
        throw new DOMException('test refusal', canceled ? 'AbortError' : 'NotAllowedError');
      } });
    }, canceled);
    const button = page.getByRole('button', { name: /שתפו/ });
    await button.click();
    await expect(button).toBeEnabled();
    if (canceled) await expect(page.getByText(/השיתוף לא הצליח/)).toHaveCount(0);
    else await expect(page.getByRole('status').filter({ hasText: 'השיתוף לא הצליח' })).toBeVisible();
    expect(errors).toEqual([]);
  });
}
