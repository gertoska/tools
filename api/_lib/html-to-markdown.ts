import { Readability } from '@mozilla/readability';
import { parseHTML } from 'linkedom';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
import { FetchError } from './errors.js';

export type ConvertMode = 'main' | 'full';

export interface ConvertResult {
  markdown: string;
  title: string;
  /** True when "main" was asked for but the page had no article to extract. */
  usedFallback: boolean;
}

/** Elements that are never content, and some of which would run or load things. */
const NOISE = 'script, style, noscript, iframe, frame, object, embed, form, template, canvas, svg';

/** Below this many characters of text, Readability found no real article. */
const MIN_ARTICLE_CHARS = 200;
/** Below this many characters of Markdown, there is nothing worth returning. */
const MIN_MARKDOWN_CHARS = 20;

const LINK_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);
const IMAGE_PROTOCOLS = new Set(['http:', 'https:']);

function absolute(value: string, base: string): URL | undefined {
  try {
    return new URL(value.trim(), base);
  } catch {
    return undefined;
  }
}

/**
 * Makes every link and image absolute against the page's final URL. Links with
 * any other scheme (javascript:, data:, vbscript:...) lose the link and keep
 * the text; images that are not http(s) are dropped.
 */
function resolveUrls(document: Document, base: string): void {
  for (const link of document.querySelectorAll('a')) {
    const href = link.getAttribute('href');
    if (href === null) continue;
    const url = absolute(href, base);
    if (url !== undefined && LINK_PROTOCOLS.has(url.protocol)) {
      link.setAttribute('href', url.href);
    } else {
      link.removeAttribute('href');
    }
  }

  for (const image of document.querySelectorAll('img')) {
    // Lazy-loading pages keep the real address in data-src.
    const source = image.getAttribute('src') ?? image.getAttribute('data-src');
    const url = source === null ? undefined : absolute(source, base);
    if (url !== undefined && IMAGE_PROTOCOLS.has(url.protocol)) {
      image.setAttribute('src', url.href);
    } else {
      image.remove();
    }
  }
}

/**
 * Turndown copies a few elements through as raw HTML (a table with no header
 * row, for one), attributes included. Keep only what Markdown can use, so no
 * onclick or style can ride along into text someone may paste elsewhere.
 * `class` stays because that is where Turndown reads `language-js` from.
 */
const KEPT_ATTRIBUTES = new Set([
  'href',
  'src',
  'alt',
  'title',
  'class',
  'colspan',
  'rowspan',
  'start',
]);

function stripAttributes(document: Document): void {
  for (const element of document.querySelectorAll('*')) {
    for (const { name } of Array.from(element.attributes)) {
      if (!KEPT_ATTRIBUTES.has(name)) element.removeAttribute(name);
    }
  }
}

function createTurndown(): TurndownService {
  const turndown = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
    hr: '---',
  });
  turndown.use(gfm);
  return turndown;
}

/** Collapses what Turndown leaves behind: runs of blank lines and trailing spaces. */
function tidy(markdown: string): string {
  return markdown
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Real pages stay well under both; hostile ones are built to blow past them. */
const MAX_DEPTH = 400;
const MAX_TAGS = 120_000;
/** Sum over every tag of how deep it sits: the cost the parser and extractor actually pay. */
const MAX_WORK = 2_000_000;

/** Elements with no end tag, and elements the parser closes by itself. Neither deepens the tree. */
const FLAT = new Set(
  'area base br col embed hr img input link meta param source track wbr p li dt dd tr td th option'.split(
    ' ',
  ),
);

/**
 * Parsing and extraction are synchronous, so a timeout cannot interrupt them,
 * and a deeply nested page makes them take quadratic time: a 2 MB pile of
 * <div> would hold the function for minutes. A cheap linear scan of the tags
 * refuses those before any parser sees them.
 */
function assertNotPathological(html: string): void {
  let depth = 0;
  let tags = 0;
  let work = 0;
  for (const [, closing, name = ''] of html.matchAll(/<(\/?)([a-zA-Z][\w:-]*)[^>]*>/g)) {
    work += depth;
    if (++tags > MAX_TAGS || work > MAX_WORK) throw new FetchError('too_complex');
    const tag = name.toLowerCase();
    if (FLAT.has(tag)) continue;
    if (closing === '/') depth = Math.max(0, depth - 1);
    else if (++depth > MAX_DEPTH) throw new FetchError('too_complex');
  }
}

/**
 * linkedom is not a spec-compliant HTML parser: without an <html> element it
 * leaves the whole page outside <body>. Real pages sometimes omit it, so add
 * the missing wrapper before parsing.
 */
function withDocumentShell(html: string): string {
  if (/<html[\s>]/i.test(html)) return html;
  return /<body[\s>]/i.test(html) ? `<html>${html}</html>` : `<html><body>${html}</body></html>`;
}

/**
 * Turns an HTML page into Markdown. "main" keeps the article (Readability) and
 * falls back to the whole <body> when there is none; "full" keeps the whole
 * <body>. Nothing here renders HTML: the result is plain text for a textarea.
 */
export function htmlToMarkdown(
  html: string,
  pageUrl: string,
  mode: ConvertMode = 'main',
): ConvertResult {
  assertNotPathological(html);
  const { document } = parseHTML(withDocumentShell(html));

  for (const element of document.querySelectorAll(NOISE)) element.remove();
  resolveUrls(document, pageUrl);
  stripAttributes(document);

  const pageTitle = document.title.trim() || document.querySelector('h1')?.textContent.trim() || '';

  let content = '';
  let title = pageTitle;
  let usedFallback = false;

  if (mode === 'main') {
    try {
      const article = new Readability(document.cloneNode(true) as Document, {
        // Keep class names: Turndown reads language-* from them to fence code.
        keepClasses: true,
      }).parse();
      if (article !== null && (article.textContent?.trim().length ?? 0) >= MIN_ARTICLE_CHARS) {
        content = article.content ?? '';
        title = article.title?.trim() || pageTitle;
      }
    } catch {
      // A page Readability cannot parse is handled like one with no article.
    }
    usedFallback = content === '';
  }

  // Reading a serialization on the server, for Turndown: nothing is ever injected into a page.
  // eslint-disable-next-line no-restricted-syntax
  if (content === '') content = document.body.innerHTML;

  const markdown = tidy(createTurndown().turndown(content));
  if (markdown.length < MIN_MARKDOWN_CHARS) throw new FetchError('empty_content');

  return { markdown, title, usedFallback };
}
