import { expect, test, type Page } from '@playwright/test';

// Only Chromium lets a test read the clipboard back.
test.skip(({ browserName }) => browserName !== 'chromium', 'clipboard needs Chromium');

test.beforeEach(async ({ context, page }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('./');
});

const read = (page: Page) => page.evaluate(() => navigator.clipboard.readText());

test('copies the slug and says so out loud', async ({ page }) => {
  await page.locator('#input').fill('Hello World');
  await page.getByRole('button', { name: 'Copy', exact: true }).click();
  await expect(page.locator('#status')).toHaveText('Slug copied');
  expect(await read(page)).toBe('hello-world');
});

test('copies the slug as a path', async ({ page }) => {
  await page.locator('#input').fill('Hello World');
  await page.getByRole('button', { name: 'Copy as /path' }).click();
  expect(await read(page)).toBe('/hello-world');
});

test('the shareable link carries the options and not the text', async ({ page }) => {
  await page.locator('#input').fill('My private draft title');
  await page.locator('#separator').selectOption('_');
  await page.getByRole('button', { name: 'Copy link' }).click();

  const link = await read(page);
  expect(link).toContain('#sep=_');
  expect(link).not.toContain('private');
  expect(link).not.toContain('draft');
  expect(new URL(link).search).toBe('');
});

test('copies every slug in bulk mode', async ({ page }) => {
  await page.getByRole('tab', { name: 'Many' }).click();
  await page.locator('#bulk-input').fill('Hello\nCafé & Bar');
  await page.getByRole('button', { name: 'Copy all' }).click();
  expect(await read(page)).toBe('hello\ncafe-and-bar');
});
