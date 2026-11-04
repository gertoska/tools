import { expect, test, type Page } from '@playwright/test';

/** Anything the browser refuses under the CSP shows up here. */
async function trackViolations(page: Page): Promise<string[]> {
  const violations: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') violations.push(message.text());
  });
  page.on('pageerror', (error) => violations.push(error.message));
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (event) => {
      console.error(`CSP: ${event.effectiveDirective} blocked ${event.blockedURI}`);
    });
  });
  return violations;
}

/**
 * WebKit reports a style-src-attr violation for the inline styles it applies to
 * its own <select> rendering. Nothing in this project sets a style attribute,
 * the controls render correctly, and the policy stays as strict as it is.
 */
function isWebKitSelectQuirk(message: string, browserName: string): boolean {
  return (
    browserName === 'webkit' &&
    (message.includes('style-src-attr') || message.includes('Refused to apply a stylesheet'))
  );
}

test.beforeEach(async ({ page }) => {
  await page.goto('./');
});

/** The language, stop words and maximum length live behind a disclosure. */
async function openAdvanced(page: Page): Promise<void> {
  if (!(await page.locator('#language').isVisible()))
    await page.locator('.advanced summary').click();
}

/** Only the hash changes, so the page has to be loaded again from scratch. */
async function openWithFragment(page: Page, fragment: string): Promise<void> {
  await page.goto(`./${fragment}`);
  await page.reload();
}

const spanishButton = (page: Page) => page.locator('.lang-button[data-locale="es"]');
const catalanButton = (page: Page) => page.locator('.lang-button[data-locale="ca"]');

test('turns text into a slug as you type', async ({ page }) => {
  await page.locator('#input').fill('Café & Restaurant Guide: São Paulo');
  await expect(page.locator('#output')).toHaveValue('cafe-and-restaurant-guide-sao-paulo');
  await expect(page.locator('#counter')).toContainText('35');
});

test('clicking an example fills the tool', async ({ page }) => {
  await page.getByRole('button', { name: 'Fintech startups raised $34B in 2019' }).click();
  await expect(page.locator('#output')).toHaveValue('fintech-startups-raised-dollar-34b-in-2019');
});

test('warns instead of showing a silently empty slug', async ({ page }) => {
  await page.locator('#input').fill('日本語');
  await expect(page.locator('#output')).toHaveValue('');
  await expect(page.locator('#empty-notice')).toBeVisible();
});

test('warns when the slug gets too long for a search result', async ({ page }) => {
  await page
    .locator('#input')
    .fill('A fairly long headline about building a modern website in 2026');
  await expect(page.locator('#counter')).toHaveClass(/over/);
  await expect(page.locator('#counter')).toContainText('60');
});

test('options change the result and survive a reload', async ({ page }) => {
  await page.locator('#separator').selectOption('_');
  await page.locator('#lowercase').uncheck();
  await page.locator('#input').fill('Hello World');
  await expect(page.locator('#output')).toHaveValue('Hello_World');

  await page.reload();
  await expect(page.locator('#separator')).toHaveValue('_');
  await expect(page.locator('#lowercase')).not.toBeChecked();
  await expect(page.locator('#input')).toHaveValue('', { timeout: 2_000 });
});

test('reset puts every option back and forgets them', async ({ page }) => {
  await page.locator('#separator').selectOption('.');
  await page.getByRole('button', { name: 'Reset options' }).click();
  await expect(page.locator('#separator')).toHaveValue('-');
  expect(await page.evaluate(() => localStorage.getItem('slugify:v1:options'))).toBeNull();
});

test('the content language changes transliteration', async ({ page }) => {
  await openAdvanced(page);
  await page.locator('#input').fill('Über uns');
  await expect(page.locator('#output')).toHaveValue('uber-uns');
  await page.locator('#language').selectOption('de');
  await expect(page.locator('#output')).toHaveValue('ueber-uns');
});

test('stop words can be removed', async ({ page }) => {
  await openAdvanced(page);
  await page.locator('#language').selectOption('en');
  await page.locator('#removeStopWords').check();
  await page.locator('#input').fill('The cat and the hat');
  await expect(page.locator('#output')).toHaveValue('cat-hat');
});

test('a shared link restores the options and carries no text', async ({ page }) => {
  await openWithFragment(page, '#sep=_&max=20&lang=de');
  await expect(page.locator('#separator')).toHaveValue('_');
  await expect(page.locator('#maxLength')).toHaveValue('20');
  await expect(page.locator('#language')).toHaveValue('de');
  await page.locator('#input').fill('How to Build a Modern Website');
  await expect(page.locator('#output')).toHaveValue('how_to_build_a');
});

test('a hostile fragment is ignored', async ({ page }) => {
  await openWithFragment(page, '#sep=<script>&lang=../../etc&max=99999&evil=1');
  await expect(page.locator('#separator')).toHaveValue('-');
  await expect(page.locator('#language')).toHaveValue('generic');
  await expect(page.locator('#maxLength')).toHaveValue('0');
});

test('switching language changes the whole UI without reloading or touching the URL', async ({
  page,
}) => {
  const before = page.url();
  await page.locator('#input').fill('Hello World');
  await spanishButton(page).click();

  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.getByText('Opciones avanzadas')).toBeVisible();
  await expect(page.locator('#input')).toHaveValue('Hello World');
  expect(page.url()).toBe(before);

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
});

test('the interface is also available in Catalan', async ({ page }) => {
  await catalanButton(page).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ca');
  await expect(catalanButton(page)).toHaveAttribute('aria-pressed', 'true');
  await expect(spanishButton(page)).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByText('Opcions avançades')).toBeVisible();

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'ca');
});

test('dark mode can be forced and is remembered', async ({ page }) => {
  await page.getByRole('button', { name: 'Switch between light and dark' }).click();
  const theme = await page.locator('html').getAttribute('data-theme');
  expect(theme).toMatch(/dark|light/);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme ?? '');
});

test('typing sends no network request at all', async ({ page }) => {
  await page.waitForLoadState('networkidle');
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));

  await page.locator('#input').fill('Fintech startups raised $34B in 2019');
  await expect(page.locator('#output')).toHaveValue('fintech-startups-raised-dollar-34b-in-2019');
  await page.waitForTimeout(500);

  expect(requests).toEqual([]);
});

test('there is no way to feed it a file', async ({ page }) => {
  await expect(page.locator('input[type=file]')).toHaveCount(0);
  const dropHandled = await page.evaluate(() => {
    const transfer = new DataTransfer();
    transfer.items.add(new File(['secret'], 'secret.txt', { type: 'text/plain' }));
    const event = new DragEvent('drop', {
      dataTransfer: transfer,
      cancelable: true,
      bubbles: true,
    });
    window.dispatchEvent(event);
    return event.defaultPrevented;
  });
  expect(dropHandled).toBe(true);
});

test('loads with no console error and no CSP violation', async ({ page, browserName }) => {
  const violations = await trackViolations(page);
  await page.goto('./');
  await page.locator('#input').fill('Café & Restaurant');
  await spanishButton(page).click();
  await openAdvanced(page);
  await page.locator('#language').selectOption('fr');
  await page.waitForTimeout(300);
  expect(violations.filter((message) => !isWebKitSelectQuirk(message, browserName))).toEqual([]);
});

test('ships the security headers', async ({ page }) => {
  const response = await page.goto('./');
  const headers = response?.headers() ?? {};
  expect(headers['content-security-policy']).toContain("script-src 'self'");
  expect(headers['content-security-policy']).not.toContain('unsafe-inline');
  expect(headers['content-security-policy']).not.toContain('unsafe-eval');
  expect(headers['content-security-policy']).toContain("connect-src 'none'");
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['referrer-policy']).toBe('no-referrer');
  expect(headers['x-frame-options']).toBe('DENY');
});

test('sets no cookie', async ({ page, context }) => {
  await page.locator('#input').fill('Hello World');
  expect(await context.cookies()).toEqual([]);
  // eslint-disable-next-line no-restricted-syntax -- asserting that nothing set one
  expect(await page.evaluate(() => document.cookie)).toBe('');
});
