import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { htmlToMarkdown } from '../../api/_lib/html-to-markdown.ts';

const fixture = (name: string) =>
  readFileSync(new URL(`./fixtures/${name}.html`, import.meta.url), 'utf8');

const PAGE = 'https://example.com/blog/post/';

describe('htmlToMarkdown: main content', () => {
  const result = htmlToMarkdown(fixture('article'), PAGE);

  it('keeps the article and drops navigation, footer, scripts and forms', () => {
    expect(result.usedFallback).toBe(false);
    expect(result.markdown).toContain('first paragraph of a real article');
    expect(result.markdown).not.toContain('Copyright Example Blog');
    expect(result.markdown).not.toContain('tracking');
    expect(result.markdown).not.toContain('color: red');
    expect(result.markdown).not.toContain('Subscribe now');
  });

  it('uses ATX headings and fenced code with its language', () => {
    expect(result.markdown).toMatch(/^## Why it works$/m);
    expect(result.markdown).toContain('```js\nconst x = 1;\nconsole.log(x);\n```');
  });

  it('writes lists, emphasis and inline code', () => {
    expect(result.markdown).toMatch(/^- {1,3}First item$/m);
    expect(result.markdown).toContain('**bold**');
    expect(result.markdown).toContain('`inline code`');
  });

  it('writes tables as GFM tables', () => {
    expect(result.markdown).toContain('| Name | Size |');
    expect(result.markdown).toContain('| --- | --- |');
    expect(result.markdown).toContain('| small | 1 |');
  });

  it('resolves relative links and images against the final URL', () => {
    expect(result.markdown).toContain('[the docs](https://example.com/docs/start)');
    expect(result.markdown).toContain('![A diagram](https://example.com/img/diagram.png)');
    expect(result.markdown).toContain('[remote page](https://other.example/page)');
  });

  it('drops javascript: links but keeps their text, and data: images entirely', () => {
    expect(result.markdown).toContain('a script link');
    expect(result.markdown).not.toContain('javascript:');
    expect(result.markdown).not.toContain('data:');
    expect(result.markdown).not.toContain('Inline pixel');
  });

  it('reports the title', () => {
    expect(result.title).toContain('How we built it');
  });
});

describe('htmlToMarkdown: full page', () => {
  it('keeps the footer that main mode drops', () => {
    const { markdown, usedFallback } = htmlToMarkdown(fixture('article'), PAGE, 'full');
    expect(usedFallback).toBe(false);
    expect(markdown).toContain('Copyright Example Blog');
    expect(markdown).toContain('first paragraph of a real article');
    expect(markdown).not.toContain('tracking');
  });
});

describe('htmlToMarkdown: pages with no article', () => {
  it('falls back to the whole body and says so', () => {
    const { markdown, title, usedFallback } = htmlToMarkdown(fixture('short'), PAGE);
    expect(usedFallback).toBe(true);
    expect(title).toBe('Short page');
    expect(markdown).toContain('# Just a note');
    expect(markdown).toContain('[a relative link](https://example.com/blog/post/next)');
  });

  it('refuses an empty shell, as an SPA without server rendering is', () => {
    expect(() => htmlToMarkdown(fixture('spa'), PAGE)).toThrowError(
      expect.objectContaining({ code: 'empty_content' }) as Error,
    );
  });
});

describe('htmlToMarkdown: hostile input', () => {
  it('drops every attribute Markdown cannot use, even in HTML Turndown passes through', () => {
    const html = `<html><body><table onclick="alert(1)" style="x"><tr><td onmouseover="alert(2)" id="a">cell content here</td></tr></table></body></html>`;
    const { markdown } = htmlToMarkdown(html, PAGE, 'full');
    expect(markdown).toContain('cell content here');
    expect(markdown).not.toMatch(/onclick|onmouseover|alert|style=|id=/);
  });

  it('refuses a page nested so deep that parsing it would take minutes', () => {
    const html = `<html><body>${'<div>'.repeat(100_000)}text</body></html>`;
    expect(() => htmlToMarkdown(html, PAGE)).toThrowError(
      expect.objectContaining({ code: 'too_complex' }) as Error,
    );
  });

  it('refuses a page with an absurd number of tags', () => {
    const html = `<html><body>${'<i>a</i>'.repeat(70_000)}</body></html>`;
    expect(() => htmlToMarkdown(html, PAGE)).toThrowError(
      expect.objectContaining({ code: 'too_complex' }) as Error,
    );
  });

  it('does not mistake auto-closed tags for nesting', () => {
    const html = `<html><body><ul>${'<li>an item of a long list that is never closed'.repeat(2000)}</ul></body></html>`;
    expect(htmlToMarkdown(html, PAGE, 'full').markdown).toContain('an item of a long list');
  });

  it('never lets a script survive into the output', () => {
    const html = `<body><h1>Title here</h1><p>Some text that is long enough to count.</p>
      <script>alert(1)</script><img src="x" onerror="alert(2)"><iframe src="https://evil.example"></iframe></body>`;
    const { markdown } = htmlToMarkdown(html, PAGE, 'full');
    expect(markdown).not.toContain('alert');
    expect(markdown).not.toContain('<script');
    expect(markdown).not.toContain('iframe');
  });

  it('survives malformed markup', () => {
    const { markdown } = htmlToMarkdown(
      '<p>Unclosed <b>bold <i>and italic<div>and a block, with enough words</p></b>',
      PAGE,
      'full',
    );
    expect(markdown).toContain('Unclosed');
  });
});
