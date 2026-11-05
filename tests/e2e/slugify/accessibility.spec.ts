import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

test.skip(({ browserName }) => browserName !== 'chromium', 'one engine is enough for axe');

async function scan(page: Page) {
  return new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
}

test('the tool has no accessibility violations in light mode', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/slugify/');
  await page.locator('#input').fill('Café & Restaurant Guide: São Paulo');
  expect((await scan(page)).violations).toEqual([]);
});

test('the tool has no accessibility violations in dark mode', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/slugify/');
  await page.getByRole('tab', { name: 'Many' }).click();
  await page.locator('#bulk-input').fill('Hello\nhello');
  expect((await scan(page)).violations).toEqual([]);
});

test('the advanced panel has no accessibility violations', async ({ page }) => {
  await page.goto('/slugify/');
  await page.locator('.advanced summary').click();
  await page.locator('#removeStopWords').check();
  expect((await scan(page)).violations).toEqual([]);
});

test('the Catalan interface has no accessibility violations', async ({ page }) => {
  await page.goto('/slugify/');
  await page.locator('.lang-button[data-locale="ca"]').click();
  expect((await scan(page)).violations).toEqual([]);
});

test('the privacy page has no accessibility violations', async ({ page }) => {
  await page.goto('/slugify/privacy/');
  expect((await scan(page)).violations).toEqual([]);
});

test('the result is announced politely', async ({ page }) => {
  await page.goto('/slugify/');
  await expect(page.locator('#counter')).toHaveAttribute('aria-live', 'polite');
  await expect(page.locator('#status')).toHaveAttribute('role', 'status');
});
