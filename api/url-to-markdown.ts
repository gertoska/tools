import { FetchError, STATUS_BY_CODE } from './_lib/errors.ts';
import { htmlToMarkdown } from './_lib/html-to-markdown.ts';
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
 * GET /api/url-to-markdown?url=...&mode=main|full
 *
 * Answers { markdown, title, finalUrl, usedFallback }. `usedFallback` is true
 * when "main" was asked for but the page had no article, so the whole page was
 * converted instead. Failures answer { error: <code> } and nothing else.
 */
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get('url');
  const mode = searchParams.get('mode') ?? 'main';
  if (target === null || (mode !== 'main' && mode !== 'full')) {
    return json({ error: 'invalid_url' }, STATUS_BY_CODE.invalid_url);
  }

  try {
    const { html, finalUrl } = await fetchHtml(target);
    const { markdown, title, usedFallback } = htmlToMarkdown(html, finalUrl, mode);
    return json({ markdown, title, finalUrl, usedFallback }, 200);
  } catch (error) {
    // Answer with the code alone: no URL, no upstream message, nothing logged.
    const code = error instanceof FetchError ? error.code : 'network';
    return json({ error: code }, STATUS_BY_CODE[code]);
  }
}
