import { FetchError, STATUS_BY_CODE } from './_lib/errors.ts';
import { fetchHtml } from './_lib/safe-fetch.ts';

const HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  // Nothing about a request is worth keeping: not in a cache, not in a log.
  'cache-control': 'no-store',
} as const;

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: HEADERS });
}

/**
 * GET /api/url-to-markdown?url=...
 *
 * Phase 2: fetches the page safely and reports what it got. The HTML to
 * Markdown conversion replaces the body below in phase 3.
 */
export async function GET(request: Request): Promise<Response> {
  const target = new URL(request.url).searchParams.get('url');
  if (target === null) return json({ error: 'invalid_url' }, STATUS_BY_CODE.invalid_url);

  try {
    const { html, finalUrl } = await fetchHtml(target);
    return json({ finalUrl, length: html.length }, 200);
  } catch (error) {
    // Answer with the code alone: no URL, no upstream message, nothing logged.
    const code = error instanceof FetchError ? error.code : 'network';
    return json({ error: code }, STATUS_BY_CODE[code]);
  }
}
