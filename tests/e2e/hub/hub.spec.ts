import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('the hub links to every tool', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /Slugify/ })).toHaveAttribute('href', '/slugify/');
  await page.getByRole('link', { name: /Slugify/ }).click();
  await expect(page).toHaveURL(/\/slugify\/$/);
  await page.getByRole('link', { name: 'All tools' }).click();
  await expect(page).toHaveURL(/\/$/);
});

test('the hub links to URL to Markdown', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /URL to Markdown/ }).click();
  await expect(page).toHaveURL(/\/url-to-markdown\/$/);
});

test('the language choice is shared between the hub and the tools', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'ES' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Herramientas');
  await page.goto('/slugify/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
});

test('the hub has no accessibility violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
