import { readFile } from 'node:fs/promises';
import { expect, test, type Download } from '@playwright/test';

async function readDownload(download: Download): Promise<string> {
  const file = await download.path();
  return readFile(file, 'utf8');
}

const LIST = ['Hello', 'hello', 'HELLO!', '=HYPERLINK("http://evil.example")'].join('\n');

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await page.getByRole('tab', { name: 'Many' }).click();
});

test('one line in, one slug out, with repeats numbered', async ({ page }) => {
  await page.locator('#bulk-input').fill('Hello\nhello\nHELLO!');
  const slugs = page.locator('#bulk-body td.slug');
  await expect(slugs).toHaveCount(3);
  await expect(slugs.nth(0)).toHaveText('hello');
  await expect(slugs.nth(1)).toHaveText(/hello-2/);
  await expect(slugs.nth(2)).toHaveText(/hello-3/);
  await expect(page.locator('#bulk-summary')).toContainText('3');
});

test('repeats are left alone when numbering is off', async ({ page }) => {
  await page.locator('#dedupe').uncheck();
  await page.locator('#bulk-input').fill('Hello\nhello');
  const slugs = page.locator('#bulk-body td.slug');
  await expect(slugs.nth(0)).toHaveText('hello');
  await expect(slugs.nth(1)).toHaveText('hello');
});

test('the csv download escapes anything a spreadsheet would run', async ({ page }) => {
  await page.locator('#bulk-input').fill(LIST);
  await expect(page.locator('#bulk-body tr')).toHaveCount(4);

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download .csv' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('slugs.csv');

  const csv = await readDownload(download);

  expect(csv).toContain(`"Original","Slug"`);
  expect(csv).toContain('"\'=HYPERLINK(""http://evil.example"")"');
});

test('the txt download holds one slug per line', async ({ page }) => {
  await page.locator('#bulk-input').fill('Hello\nCafé & Bar');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download .txt' }).click();
  const download = await downloadPromise;

  expect(await readDownload(download)).toBe('hello\ncafe-and-bar\n');
});

test('tabs can be driven from the keyboard', async ({ page }) => {
  const bulkTab = page.getByRole('tab', { name: 'Many' });
  await bulkTab.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#panel-single')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#panel-bulk')).toBeVisible();
});
