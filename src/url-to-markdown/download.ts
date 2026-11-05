import { slugify } from '../slugify/engine';

const MAX_NAME_LENGTH = 80;

/**
 * `https://example.com/blog/mi-post` becomes `example-com-blog-mi-post.md`.
 * The slug engine is the one Slugify uses; it cuts at a word boundary.
 */
export function filenameFor(address: string): string {
  let text = '';
  try {
    const { hostname, pathname } = new URL(address);
    text = `${hostname}${decodePath(pathname)}`;
  } catch {
    /* Not a URL: fall through to the default name. */
  }
  const slug = slugify(text, { maxLength: MAX_NAME_LENGTH, symbolsToWords: false });
  return `${slug === '' ? 'page' : slug}.md`;
}

function decodePath(pathname: string): string {
  try {
    return decodeURIComponent(pathname);
  } catch {
    return pathname;
  }
}

export interface FrontMatter {
  title: string;
  source: string;
  /** Calendar date, YYYY-MM-DD. */
  date: string;
}

/** JSON strings are valid YAML double-quoted strings, so nothing needs escaping by hand. */
export function withFrontMatter(markdown: string, meta: FrontMatter): string {
  const lines = [
    '---',
    `title: ${JSON.stringify(meta.title)}`,
    `source: ${JSON.stringify(meta.source)}`,
    `date: ${meta.date}`,
    '---',
  ];
  return `${lines.join('\n')}\n\n${markdown}\n`;
}

export function today(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}
