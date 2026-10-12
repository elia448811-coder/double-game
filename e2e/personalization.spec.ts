import { expect, test, type Page } from '@playwright/test';
import { builtInContent } from '../src/data/allContent';

const cards = [
  { id: 'fav-question', title: 'הרגע שלכם', description: 'איזה רגע קטן תרצו לזכור מהשבוע?', category: 'calm', level: 'easy', kind: 'question' },
  { id: 'fav-task', title: 'סיפור משותף', description: 'המציאו יחד סיפור קצר ומשעשע.', category: 'creative', level: 'normal', kind: 'task' },
  { id: 'fav-mature', title: 'הערב הפרטי', description: 'איזו מחווה אינטימית נעימה לשניכם?', category: 'spicy', level: 'easy', kind: 'question' },
  { id: 'fav-hidden', title: 'פריט מוסתר', description: 'פריט שלא אמור להופיע.', category: 'calm', level: 'easy', kind: 'question' },
  { id: 'fav-boundary', title: 'תמונה משותפת', description: 'צלמו תמונה משותפת.', category: 'creative', level: 'easy', kind: 'task' },
];
async function seed(page: Page, favorites = cards.map((item) => item.id)) {
  await page.addInitScript(({ cards, favorites }) => {
    localStorage.setItem('couple-spin-onboarding-done', '1');
    if (!localStorage.getItem('personalization-test-seeded')) {
      localStorage.setItem('couple-spin-custom-content', JSON.stringify(cards));
      localStorage.setItem('couple-spin-favorites', JSON.stringify(favorites));
      localStorage.setItem('couple-spin-hidden-tasks', JSON.stringify(['fav-hidden']));
      localStorage.setItem('couple-spin-boundaries', JSON.stringify({ playerOne: [], playerTwo: [] }));
      localStorage.setItem('personalization-test-seeded', 'true');
    }
  }, { cards, favorites });
  await page.goto('/');
}
async function openFavorites(page: Page) {
  await page.getByRole('button', { name: /המועדפים שלכם/ }).click();
  await expect(page.getByRole('heading', { name: 'המועדפים שלכם', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
}

test('layouts: favorites can be searched, filtered and removed and stay removed after reload', async ({ page }) => {
  await seed(page);
  await openFavorites(page);
  await expect(page.locator('.favorite-card')).toHaveCount(2);
  const savedCard = await page.locator('.favorite-card').first().boundingBox();
  const savedArt = await page.locator('.favorite-card .content-artwork').first().boundingBox();
  expect(Math.abs(savedCard!.width - savedArt!.width)).toBeLessThan(3);
  await expect(page.getByRole('heading', { name: 'פריט מוסתר' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'תמונה משותפת' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'הערב הפרטי' })).toHaveCount(0);
  await page.getByRole('radiogroup', { name: 'סוג המועדפים' }).getByRole('radio', { name: 'שאלות', exact: true }).click();
  await expect(page.locator('.favorite-card')).toHaveCount(1);
  await page.getByLabel('חיפוש במועדפים').fill('לא נמצא');
  await expect(page.getByRole('button', { name: 'התחילו עם הרשימה הזו' })).toBeDisabled();
  await page.getByLabel('חיפוש במועדפים').fill('השבוע');
  await expect(page.getByRole('heading', { name: 'הרגע שלכם' })).toBeVisible();
  await page.getByRole('button', { name: 'הסרת הרגע שלכם מהמועדפים' }).click();
  await expect(page.getByRole('status')).toContainText('הפריט הוסר');
  await page.reload();
  await openFavorites(page);
  await expect(page.locator('.favorite-card')).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'סיפור משותף' })).toBeVisible();
});

test('favorites evening stays in its saved collection, resumes and switches back to the regular bank', async ({ page }) => {
  await seed(page, ['fav-question']);
  await openFavorites(page);
  await page.getByRole('button', { name: 'התחילו עם הרשימה הזו' }).click();
  await expect(page.getByRole('heading', { name: 'ערב מהמועדפים שלכם' })).toBeVisible();
  await expect(page.locator('#setup-content .option-card[aria-pressed="true"]')).toContainText('שאלות');
  await page.getByRole('button', { name: 'הכל מוכן — ממשיכים' }).click();
  await page.getByRole('button', { name: /דלגו על הקובייה/ }).click();
  await page.getByRole('button', { name: 'סובב את הגלגל' }).click();
  await expect(page.locator('#task-modal-title')).toContainText('השבוע');
  await page.getByRole('button', { name: /עוד אפשרויות/ }).click();
  await expect(page.getByRole('button', { name: /נשמר במועדפים/ })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: /שאלה אחרת/ }).click();
  await expect(page.locator('.task-modal').getByRole('status')).toContainText('אין כרגע');
  await expect(page.locator('.game-card .site-gate__error')).toHaveCount(0);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('couple-spin-seen-content')!)[0].id)).toBe('fav-question');
  await page.reload();
  await expect(page.locator('#task-modal-title')).toContainText('השבוע');
  await page.getByRole('button', { name: /דיברנו על זה/ }).click();
  await page.getByRole('button', { name: 'סיום משחק', exact: true }).click();
  await page.getByRole('button', { name: 'כן, סיימו' }).click();
  await page.locator('.end-actions__more summary').click();
  await page.getByRole('button', { name: 'חזרה לראשי' }).click();
  await page.getByRole('button', { name: /בואו נתחיל/ }).click();
  await expect(page.getByRole('heading', { name: 'ערב מהמועדפים שלכם' })).toHaveCount(0);
  await page.getByRole('button', { name: 'הכל מוכן — ממשיכים' }).click();
  await page.getByRole('button', { name: /דלגו על הקובייה/ }).click();
  expect(await page.evaluate(() => JSON.parse(sessionStorage.getItem('couple-spin-active-game')!).favoriteTaskIds)).toBeUndefined();
});

test('empty favorites give an explanation and never start an empty game', async ({ page }) => {
  await seed(page, []);
  await openFavorites(page);
  await expect(page.getByRole('heading', { name: 'המועדפים שלכם מתחילים כאן' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'התחילו עם הרשימה הזו' })).toBeDisabled();
  await page.getByRole('button', { name: 'חזרה למסך הראשי' }).click();
  await expect(page.getByRole('button', { name: /בואו נתחיל/ })).toBeVisible();
});

test('mature favorites require age confirmation and shared boundaries before use', async ({ page }) => {
  await seed(page, ['fav-mature']);
  await openFavorites(page);
  await page.getByRole('radiogroup', { name: 'תוכן במועדפים' }).getByRole('radio', { name: '18+', exact: true }).click();
  await expect(page.getByRole('dialog', { name: /מצב בוגרים/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'הערב הפרטי' })).toHaveCount(0);
  await page.getByRole('button', { name: 'ביטול', exact: true }).click();
  await expect(page.getByRole('button', { name: 'התחילו עם הרשימה הזו' })).toBeDisabled();
  await page.getByRole('radio', { name: '18+', exact: true }).click();
  await page.getByRole('button', { name: 'אנחנו מעל 18 — המשך' }).click();
  // Age confirmation alone does not override the players' boundaries.
  await expect(page.locator('.favorite-card')).toHaveCount(0);
  await page.evaluate(() => localStorage.setItem('couple-spin-boundaries', JSON.stringify({ playerOne: ['intimate'], playerTwo: ['intimate'] })));
  await page.reload(); await openFavorites(page);
  await page.getByRole('radio', { name: '18+', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'הערב הפרטי' })).toBeVisible();
  await page.getByRole('button', { name: 'התחילו עם הרשימה הזו' }).click();
  await page.getByRole('button', { name: 'הכל מוכן — ממשיכים' }).click();
  await expect(page.getByRole('heading', { name: 'מה נוח לשניכם?' })).toBeVisible();
});

test('layouts: calm display persists, suppresses effects and still completes a spin', async ({ page }) => {
  await seed(page, []);
  await page.getByRole('button', { name: 'הגדרות ופרטיות' }).click();
  await page.getByLabel('תצוגה רגועה', { exact: true }).check();
  await expect(page.locator('html')).toHaveAttribute('data-calm', 'true');
  await expect(page.locator('.mini-robot')).toHaveCount(0);
  await page.getByRole('button', { name: 'חזרה', exact: true }).click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-calm', 'true');
  await expect(page.locator('.mini-robot')).toHaveCount(0);
  await expect(page.locator('.floating-particles')).toHaveCount(0);
  await page.getByRole('button', { name: /בואו נתחיל/ }).click();
  await page.getByRole('button', { name: 'הכל מוכן — ממשיכים' }).click();
  await page.getByRole('button', { name: /דלגו על הקובייה/ }).click();
  await page.getByRole('button', { name: 'סובב את הגלגל' }).click();
  await expect(page.locator('.task-modal')).toBeVisible({ timeout: 2500 });
  await page.getByRole('button', { name: /^✓ (בוצע|דיברנו על זה)$/ }).click();
  await page.getByRole('button', { name: 'השהייה' }).click();
  await page.getByRole('button', { name: 'הגדרות', exact: true }).click();
  await page.getByLabel('תצוגה רגועה', { exact: true }).uncheck();
  await expect(page.locator('.mini-robot')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test('preference switches and confirmed memory reset preserve favorites and ratings', async ({ page }) => {
  await seed(page, ['fav-question']);
  await page.evaluate(() => {
    localStorage.setItem('couple-spin-seen-content', JSON.stringify([{ id: 'fav-question', atMs: Date.now() }]));
    localStorage.setItem('couple-spin-task-feedback', JSON.stringify({ 'fav-question': 'up' }));
  });
  await page.getByRole('button', { name: 'הגדרות ופרטיות' }).click();
  await page.getByRole('tab', { name: 'תוכן ומשחק' }).click();
  await page.getByLabel('התאמה לפי הדירוגים שלכם', { exact: true }).uncheck();
  await page.getByLabel('העדפת שאלות ומשימות חדשות', { exact: true }).uncheck();
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByRole('button', { name: 'איפוס זיכרון השאלות והמשימות' }).click();
  expect(await page.evaluate(() => localStorage.getItem('couple-spin-seen-content'))).not.toBeNull();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'איפוס זיכרון השאלות והמשימות' }).click();
  await expect(page.getByRole('status')).toContainText('אופס');
  expect(await page.evaluate(() => localStorage.getItem('couple-spin-seen-content'))).toBeNull();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('couple-spin-favorites')!))).toEqual(['fav-question']);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('couple-spin-task-feedback')!))).toEqual({ 'fav-question': 'up' });
  await page.reload();
  await page.getByRole('button', { name: 'הגדרות ופרטיות' }).click();
  await page.getByRole('tab', { name: 'תוכן ומשחק' }).click();
  await expect(page.getByLabel('התאמה לפי הדירוגים שלכם', { exact: true })).not.toBeChecked();
  await expect(page.getByLabel('העדפת שאלות ומשימות חדשות', { exact: true })).not.toBeChecked();
});

test('new questions are preferred across evenings and feedback survives a reload', async ({ page }) => {
  await seed(page, []);
  await page.evaluate((seenIds) => {
    localStorage.setItem('couple-spin-seen-content', JSON.stringify(seenIds.map((id) => ({ id, atMs: Date.now() - 60000 }))));
    const settings = JSON.parse(localStorage.getItem('couple-spin-settings') ?? '{}');
    localStorage.setItem('couple-spin-settings', JSON.stringify({ ...settings, calmDisplay: true }));
  }, builtInContent.map((item) => item.id));
  await page.addInitScript(() => { Math.random = () => .99; });
  await page.reload();
  const startEvening = async () => {
    await page.getByRole('button', { name: /בואו נתחיל/ }).click();
    await page.getByText('שאלות', { exact: true }).click();
    await page.getByRole('button', { name: 'הכל מוכן — ממשיכים' }).click();
    await page.getByRole('button', { name: /דלגו על הקובייה/ }).click();
    await page.getByRole('button', { name: 'סובב את הגלגל' }).click();
    await expect(page.locator('.task-modal')).toBeVisible();
  };
  await startEvening();
  await expect(page.locator('#task-modal-title')).toContainText('השבוע');
  await page.getByRole('button', { name: /אהבתי/ }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: /אהבתי/ })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: /דיברנו על זה/ }).click();
  await page.getByRole('button', { name: 'סיום משחק', exact: true }).click();
  await page.getByRole('button', { name: 'כן, סיימו' }).click();
  await page.locator('.end-actions__more summary').click();
  await page.getByRole('button', { name: 'חזרה לראשי' }).click();
  await startEvening();
  await expect(page.locator('#task-modal-title')).not.toContainText('השבוע');
});
