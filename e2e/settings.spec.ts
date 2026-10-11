import { expect, test } from '@playwright/test';

test('layouts: settings work with the keyboard and light theme persists', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('couple-spin-onboarding-done', '1'));
  await page.goto('/');
  await page.getByRole('button', { name: 'הגדרות ופרטיות' }).click();
  await expect(page.locator('.settings-screen')).toBeVisible();
  const dark = page.getByLabel('מצב כהה', { exact: true });
  await dark.focus();
  await page.keyboard.press('Space');
  await expect(dark).not.toBeChecked();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('radio', { name: 'לב', exact: true }).click();
  await expect(page.getByRole('radio', { name: 'לב', exact: true })).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('button', { name: 'חזרה', exact: true }).click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: /בואו נתחיל/ }).click();
  await page.getByRole('button', { name: 'הכל מוכן — ממשיכים' }).click();
  await page.getByRole('button', { name: /דלגו על הקובייה/ }).click();
  await expect(page.locator('.wheel-frame--heart')).toBeVisible();
  await expect(page.locator('.progress-bar__header')).toHaveCSS('color', 'rgb(91, 75, 138)');
});
