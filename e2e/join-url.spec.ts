import { expect, test } from '@playwright/test';

test.describe('Onboarding and invitation URL', () => {
  test('completes tutorial and removes invitation code from URL', async ({ page }) => {
    await page.goto('/?join=12345678');
    await page.getByRole('button', { name: 'הבנו — בואו נשחק!' }).click();
    await expect(page.locator('.hub-screen')).toBeVisible();
    await expect(page).not.toHaveURL(/join=/);
    await page.reload();
    await expect(page.locator('.hub-screen')).toBeVisible();
  });
});
