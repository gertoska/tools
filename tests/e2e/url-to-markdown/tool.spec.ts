import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

/** The same rule set the other tools are held to. */
const scan = (page: Page) =>
  new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();

const API = '**/api/url-to-markdown?*';

const ARTICLE = {
  markdown: '# Hello\n\nA converted page.',
  title: 'Hello "world"',
  finalUrl: 'https://example.com/blog/mi-post',
  usedFallback: false,
};

/** The server is not part of `vite preview`, so these tests answer for it. */
async function answer(page: Page, body: unknown, status = 200): Promise<{ urls: string[] }> {
  const seen = { urls: [] as string[] };
  await page.route(API, (route) => {
    seen.urls.push(route.request().url());
    return route.fulfill({ status, json: body });
  });
  return seen;
}

test.beforeEach(async ({ page }) => {
  await page.goto('/url-to-markdown/');
});

test('converts an address and shows the Markdown', async ({ page }) => {
  const seen = await answer(page, ARTICLE);
  await page.locator('#address').fill('example.com/blog/mi-post');
  await page.getByRole('button', { name: 'Convert' }).click();

  await expect(page.locator('#output')).toHaveValue(ARTICLE.markdown);
  await expect(page.locator('#source')).toContainText('https://example.com/blog/mi-post');
  await expect(page.locator('#status')).toHaveText('Markdown ready');
  await expect(page.locator('#counter')).toContainText(String(ARTICLE.markdown.length));
  expect(seen.urls).toHaveLength(1);
  const request = new URL(seen.urls[0] ?? '');
  expect(request.searchParams.get('url')).toBe('example.com/blog/mi-post');
  expect(request.searchParams.get('mode')).toBe('main');
});

test('sends the full-page mode when it is chosen', async ({ page }) => {
  const seen = await answer(page, ARTICLE);
  await page.getByRole('radio', { name: 'Full page' }).check();
  await page.locator('#address').fill('https://example.com/');
  await page.locator('#address').press('Enter');
  await expect(page.locator('#output')).toHaveValue(ARTICLE.markdown);
  expect(new URL(seen.urls[0] ?? '').searchParams.get('mode')).toBe('full');
});

test('says so when the page had no article', async ({ page }) => {
  await answer(page, { ...ARTICLE, usedFallback: true });
  await page.locator('#address').fill('https://example.com/');
  await page.getByRole('button', { name: 'Convert' }).click();
  await expect(page.locator('#fallback')).toBeVisible();
});

test('shows a clear message for each kind of failure, and clears it on success', async ({
  page,
}) => {
  await page.locator('#address').fill('https://example.com/');
  await page.route(API, (route) => route.fulfill({ status: 403, json: { error: 'blocked' } }));
  await page.getByRole('button', { name: 'Convert' }).click();
  await expect(page.locator('#error')).toContainText('cannot be fetched');
  await expect(page.locator('#output')).toHaveValue('');

  await page.unroute(API);
  await page.route(API, (route) =>
    route.fulfill({ status: 422, json: { error: 'empty_content' } }),
  );
  await page.getByRole('button', { name: 'Convert' }).click();
  await expect(page.locator('#error')).toContainText('JavaScript');

  await page.unroute(API);
  await page.route(API, (route) => route.fulfill({ json: ARTICLE }));
  await page.getByRole('button', { name: 'Convert' }).click();
  await expect(page.locator('#error')).toBeHidden();
});

test('survives a server that is down', async ({ page }) => {
  await page.route(API, (route) => route.abort());
  await page.locator('#address').fill('https://example.com/');
  await page.getByRole('button', { name: 'Convert' }).click();
  await expect(page.locator('#error')).toContainText('Something went wrong');
  await expect(page.getByRole('button', { name: 'Convert' })).toBeEnabled();
});

test('asks for an address instead of sending an empty request', async ({ page }) => {
  const seen = await answer(page, ARTICLE);
  await page.getByRole('button', { name: 'Convert' }).click();
  await expect(page.locator('#error')).toContainText('valid web address');
  expect(seen.urls).toHaveLength(0);
});

test('never renders the page as HTML', async ({ page }) => {
  await answer(page, {
    ...ARTICLE,
    markdown: '<img src=x onerror="window.__pwned = true"> <script>window.__pwned = true</script>',
  });
  await page.locator('#address').fill('https://example.com/');
  await page.getByRole('button', { name: 'Convert' }).click();
  await expect(page.locator('#output')).toHaveValue(/onerror/);
  expect(await page.evaluate(() => '__pwned' in window)).toBe(false);
  await expect(page.locator('main img')).toHaveCount(0);
});

test('downloads a named .md file, with front matter unless it is switched off', async ({
  page,
}) => {
  await answer(page, ARTICLE);
  await page.locator('#address').fill('https://example.com/blog/mi-post');
  await page.getByRole('button', { name: 'Convert' }).click();
  await expect(page.locator('#output')).toHaveValue(ARTICLE.markdown);

  const read = async (): Promise<{ name: string; text: string }> => {
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Download .md' }).click(),
    ]);
    const path = await download.path();
    return { name: download.suggestedFilename(), text: await readFile(path, 'utf8') };
  };

  const withMeta = await read();
  expect(withMeta.name).toBe('example-com-blog-mi-post.md');
  expect(withMeta.text).toMatch(
    /^---\ntitle: "Hello \\"world\\""\nsource: "https:\/\/example.com\/blog\/mi-post"\ndate: \d{4}-\d{2}-\d{2}\n---\n\n# Hello/,
  );

  await page.getByLabel('Add front matter').uncheck();
  const plain = await read();
  expect(plain.text).toBe(ARTICLE.markdown);
});

test('lets the visitor edit the Markdown before copying or downloading', async ({ page }) => {
  await answer(page, ARTICLE);
  await page.locator('#address').fill('https://example.com/');
  await page.getByRole('button', { name: 'Convert' }).click();
  await expect(page.locator('#output')).toHaveValue(ARTICLE.markdown);
  await page.locator('#output').fill('# Edited');
  await page.getByLabel('Add front matter').uncheck();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download .md' }).click(),
  ]);
  expect(await readFile(await download.path(), 'utf8')).toBe('# Edited');
});

test('copy and download stay disabled until there is Markdown', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Copy', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Download .md' })).toBeDisabled();
});

test('is translated, and the error follows the language', async ({ page }) => {
  await page.route(API, (route) => route.fulfill({ status: 504, json: { error: 'timeout' } }));
  await page.locator('#address').fill('https://example.com/');
  await page.getByRole('button', { name: 'Convert' }).click();
  await expect(page.locator('#error')).toContainText('too long');
  await page.locator('.lang-button[data-locale="es"]').click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('URL a Markdown');
  await expect(page.locator('#error')).toContainText('demasiado');
  await expect(page.getByRole('button', { name: 'Convertir' })).toBeVisible();
});

test('may call its own server, and nothing else', async ({ page }) => {
  const response = await page.request.get('/url-to-markdown/');
  const policy = response.headers()['content-security-policy'] ?? '';
  expect(policy).toContain("connect-src 'self'");
  expect(policy).toContain("default-src 'none'");
  const other = await page.request.get('/slugify/');
  expect(other.headers()['content-security-policy']).toContain("connect-src 'none'");
});

test('has no accessibility violations, empty or with a result and an error', async ({ page }) => {
  expect((await scan(page)).violations).toEqual([]);

  await answer(page, ARTICLE);
  await page.locator('#address').fill('https://example.com/');
  await page.getByRole('button', { name: 'Convert' }).click();
  await expect(page.locator('#output')).toHaveValue(ARTICLE.markdown);
  expect((await scan(page)).violations).toEqual([]);

  await page.unroute(API);
  await page.route(API, (route) => route.fulfill({ status: 403, json: { error: 'blocked' } }));
  await page.getByRole('button', { name: 'Convert' }).click();
  await expect(page.locator('#error')).toBeVisible();
  expect((await scan(page)).violations).toEqual([]);
});
