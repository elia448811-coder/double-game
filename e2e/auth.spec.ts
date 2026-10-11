import { expect, test } from '@playwright/test';

test('layouts: production build requires login despite preview query and stored game data', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('couple-spin-onboarding-done', '1');
    sessionStorage.setItem('couple-spin-active-game', '{"screen":"game"}');
  });
  await page.goto('http://127.0.0.1:4183/?preview=true');
  await expect(page.locator('.site-gate')).toBeVisible();
  await expect(page.locator('.game-screen')).toHaveCount(0);
  await expect(page.locator('html')).toHaveAttribute('data-device', /mobile|tablet/);
  const sizes = await page.evaluate(() => [innerWidth, document.documentElement.scrollWidth]);
  expect(sizes[1]).toBeLessThanOrEqual(sizes[0] + 1);
  await expect(page.locator('input[type="password"]')).toBeVisible();
  const submit = page.getByRole('button', { name: 'התחברו', exact: true });
  await expect(submit).toBeDisabled();
  await page.getByLabel('שם משתמש', { exact: true }).fill('user-with-a-long-address@example.com');
  await page.getByLabel('סיסמה', { exact: true }).fill('test-pass-123');
  await expect(page.getByLabel('שם משתמש', { exact: true })).toHaveValue('user-with-a-long-address@example.com');
  await page.getByRole('button', { name: 'הצג סיסמה' }).click();
  await expect(page.locator('#login-password')).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'הסתר סיסמה' }).click();
  await expect(page.locator('#login-password')).toHaveAttribute('type', 'password');
});
