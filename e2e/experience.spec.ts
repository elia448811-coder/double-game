import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('couple-spin-onboarding-done', '1'));
  await page.goto('/');
});

test('layouts: primary action is visible on phones and advanced choices are reachable', async ({ page }) => {
  const viewport = page.viewportSize()!;
  const start = page.getByRole('button', { name: /בואו נתחיל/ });
  await expect(start).toBeVisible();
  if (viewport.width < 600) {
    const box = await start.boundingBox();
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);
  }
  await start.click();
  await expect(page.locator('.setup-card')).toBeVisible();
  const moods = page.locator('.setup-block--moods .option-card');
  const first = await moods.nth(0).boundingBox();
  const second = await moods.nth(1).boundingBox();
  // Hover/entry transforms may offset a card slightly without changing its grid row.
  expect(Math.abs(first!.y - second!.y)).toBeLessThan(5);
  await page.locator('.setup-advanced summary').click();
  const levels = page.getByRole('radiogroup', { name: 'בחירת רמת משימות' });
  await levels.locator('[aria-checked="true"]').focus();
  await page.keyboard.press('Home');
  await expect(levels.getByRole('radio').first()).toHaveAttribute('aria-checked', 'true');
  await expect(levels.getByRole('radio').first()).toBeFocused();
  await expect(page.getByLabel('שם לערב (אופציונלי)')).toBeVisible();
  await page.getByLabel('שם לערב (אופציונלי)').fill('ערב בדיקה');
  await expect(page.getByLabel('שם לערב (אופציונלי)')).toHaveValue('ערב בדיקה');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.getByRole('button', { name: 'הכל מוכן — ממשיכים' }).click();
  await expect(page.locator('.dice-screen')).toBeVisible();
  expect(await page.evaluate(() => scrollY)).toBe(0);
});

test('layouts: settings tabs support RTL keys and preserve unfinished custom content', async ({ page }) => {
  await page.getByRole('button', { name: 'הגדרות ופרטיות' }).click();
  const display = page.getByRole('tab', { name: 'תצוגה וצליל' });
  await display.focus();
  await page.keyboard.press('ArrowLeft');
  const players = page.getByRole('tab', { name: 'שחקנים', exact: true });
  await expect(players).toBeFocused();
  await expect(players).toHaveAttribute('aria-selected', 'true');
  const avatars = page.getByRole('radiogroup', { name: 'אווטאר שחקן 1', exact: true });
  const chosen = avatars.locator('[aria-checked="true"]');
  const original = await chosen.getAttribute('data-value');
  await chosen.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(avatars.locator('[aria-checked="true"]')).toBeFocused();
  expect(await avatars.locator('[aria-checked="true"]').getAttribute('data-value')).not.toBe(original);
  await page.getByRole('tab', { name: 'תוכן ומשחק' }).click();
  await page.getByLabel('כותרת קצרה').fill('שאלה שעדיין לא סיימנו');
  await page.getByLabel('נוסח השאלה').fill('איזה רגע מהשבוע היית רוצה לזכור?');
  await page.getByRole('tab', { name: 'חשבון ופרטיות' }).click();
  await expect(page.getByLabel('כותרת קצרה')).toBeHidden();
  await page.getByRole('tab', { name: 'תוכן ומשחק' }).click();
  await expect(page.getByLabel('כותרת קצרה')).toHaveValue('שאלה שעדיין לא סיימנו');
  await expect(page.getByLabel('נוסח השאלה')).toHaveValue('איזה רגע מהשבוע היית רוצה לזכור?');
  await display.focus();
  await page.keyboard.press('End');
  await expect(page.getByRole('tab', { name: 'היסטוריה' })).toBeFocused();
  await page.keyboard.press('Home');
  await expect(display).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test('layouts: game regions use tablet space and adjust after rotating', async ({ page }) => {
  await page.getByRole('button', { name: /בואו נתחיל/ }).click();
  await page.getByText('משימות', { exact: true }).click();
  await page.getByRole('button', { name: 'הכל מוכן — ממשיכים' }).click();
  await page.getByRole('button', { name: /דלגו על הקובייה/ }).click();
  await expect(page.locator('.game-card')).toBeVisible();
  const viewport = page.viewportSize()!;
  if (viewport.width >= 960 || (viewport.width > viewport.height && viewport.height < 500)) {
    const overview = await page.locator('.game-overview').boundingBox();
    const play = await page.locator('.game-play-area').boundingBox();
    expect(play!.x + play!.width).toBeLessThanOrEqual(overview!.x + 1);
  }
  await page.setViewportSize({ width: viewport.height, height: viewport.width });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.getByRole('button', { name: 'סובב את הגלגל' }).click();
  await expect(page.locator('.task-modal')).toBeVisible();
  await page.getByRole('button', { name: /^✓ (בוצע|דיברנו על זה)$/ }).click();
  await expect(page.locator('.task-modal')).toBeHidden();
});

test('layouts: data export and keyboard import remain accessible in the account section', async ({ page }) => {
  await page.getByRole('button', { name: 'הגדרות ופרטיות' }).click();
  await page.getByRole('tab', { name: 'חשבון ופרטיות' }).click();
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'ייצוא נתונים', exact: true }).click();
  expect((await downloadEvent).suggestedFilename()).toBe('couple-spin-data.json');
  const chooserEvent = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'ייבוא נתונים', exact: true }).focus();
  await page.keyboard.press('Enter');
  await (await chooserEvent).setFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('invalid data') });
  await expect(page.getByRole('status').filter({ hasText: 'הקובץ אינו JSON תקין.' })).toBeVisible();
});

test('deleting personal content requires confirmation and refreshes its card without losing drafts', async ({ page }) => {
  await page.getByRole('button', { name: 'הגדרות ופרטיות' }).click();
  await page.getByRole('tab', { name: 'תוכן ומשחק' }).click();
  await page.getByLabel('כותרת קצרה').fill('שאלה אישית ששמרנו');
  await page.getByLabel('נוסח השאלה').fill('איזה רגע מהשבוע נרצה לזכור?');
  await page.getByRole('button', { name: /הוספה לקטגוריה/ }).click();
  await expect(page.locator('.custom-content-items')).toContainText('שאלה אישית ששמרנו');
  await page.getByLabel('כותרת קצרה').fill('טיוטה שנשארת');
  await page.getByRole('tab', { name: 'חשבון ופרטיות' }).click();
  const stored = await page.evaluate(() => localStorage.getItem('couple-spin-custom-content'));
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByRole('button', { name: 'מחיקת כל המידע המקומי', exact: true }).click();
  expect(await page.evaluate(() => localStorage.getItem('couple-spin-custom-content'))).toBe(stored);
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByRole('button', { name: 'מחיקת תוכן מותאם בלבד', exact: true }).click();
  expect(await page.evaluate(() => localStorage.getItem('couple-spin-custom-content'))).toBe(stored);
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'מחיקת תוכן מותאם בלבד', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'התוכן המותאם נמחק.' })).toBeVisible();
  await page.getByRole('tab', { name: 'תוכן ומשחק' }).click();
  await expect(page.locator('.custom-content-items')).toHaveCount(0);
  await expect(page.getByLabel('כותרת קצרה')).toHaveValue('טיוטה שנשארת');
});
