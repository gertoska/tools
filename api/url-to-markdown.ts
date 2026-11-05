import { FetchError, STATUS_BY_CODE } from './_lib/errors.js';
import { htmlToMarkdown } from './_lib/html-to-markdown.js';
import { fetchHtml } from './_lib/safe-fetch.js';

const HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  // Nothing about a request is worth keeping: not in a cache, not in a log.
  'cache-control': 'no-store',
} as const;

/** A URL is at most 2048 characters; anything near this is not a request we want. */
const MAX_BODY_CHARS = 4096;

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: HEADERS });
}

function fail(code: FetchError['code']): Response {
  return json({ error: code }, STATUS_BY_CODE[code]);
}

/** The request as sent by the page, or undefined if it is anything else. */
async function readRequest(
  request: Request,
): Promise<{ url: string; mode: 'main' | 'full' } | undefined> {
  // Requiring JSON means a browser must preflight a cross-origin call, and we
  // answer no preflight: other sites cannot use this endpoint from a visitor's browser.
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return undefined;
  }
  const text = await request.text();
  if (text.length > MAX_BODY_CHARS) return undefined;
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return undefined;
  }
  if (typeof body !== 'object' || body === null) return undefined;
  const { url, mode = 'main' } = body as Record<string, unknown>;
  if (typeof url !== 'string' || (mode !== 'main' && mode !== 'full')) return undefined;
  return { url, mode };
}

/**
 * POST /api/url-to-markdown   { "url": "...", "mode": "main" | "full" }
 *
 * Answers { markdown, title, finalUrl, usedFallback }. `usedFallback` is true
 * when "main" was asked for but the page had no article, so the whole page was
 * converted instead. Failures answer { error: <code> } and nothing else.
 *
 * It is a POST with the address in the body, not a GET with it in the query,
 * because the platform's request log records paths and query strings but not bodies.
 */
export async function POST(request: Request): Promise<Response> {
  const parsed = await readRequest(request);
  if (parsed === undefined) return fail('invalid_url');

  try {
    const { html, finalUrl } = await fetchHtml(parsed.url);
    const { markdown, title, usedFallback } = htmlToMarkdown(html, finalUrl, parsed.mode);
    return json({ markdown, title, finalUrl, usedFallback }, 200);
  } catch (error) {
    // Answer with the code alone: no URL, no upstream message, nothing logged.
    return fail(error instanceof FetchError ? error.code : 'network');
  }
}
