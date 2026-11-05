import { describe, expect, it } from 'vitest';
import { filenameFor, today, withFrontMatter } from '../../src/url-to-markdown/download.ts';

describe('filenameFor', () => {
  it.each([
    ['https://example.com/blog/mi-post', 'example-com-blog-mi-post.md'],
    ['https://example.com/', 'example-com.md'],
    ['https://example.com/a?x=1#top', 'example-com-a.md'],
    ['https://example.com/caf%C3%A9/menu', 'example-com-cafe-menu.md'],
    ['https://example.com/Q&A/tips', 'example-com-q-a-tips.md'],
    ['https://example.com/%E0%A4%A', 'example-com-e0-a4-a.md'],
  ])('%s -> %s', (address, expected) => {
    expect(filenameFor(address)).toBe(expected);
  });

  it('falls back to "page" when nothing usable is left', () => {
    expect(filenameFor('not a url')).toBe('page.md');
    expect(filenameFor('')).toBe('page.md');
  });

  it('keeps long names to about 80 characters, cutting at a word', () => {
    const name = filenameFor(`https://example.com/${'word-'.repeat(40)}end`);
    expect(name.endsWith('.md')).toBe(true);
    expect(name.length).toBeLessThanOrEqual(80 + '.md'.length);
    expect(name).not.toMatch(/-\.md$/);
  });
});

describe('withFrontMatter', () => {
  it('writes title, source and date above the Markdown', () => {
    expect(
      withFrontMatter('# Hi', {
        title: 'Hello',
        source: 'https://example.com/',
        date: '2026-11-05',
      }),
    ).toBe('---\ntitle: "Hello"\nsource: "https://example.com/"\ndate: 2026-11-05\n---\n\n# Hi\n');
  });

  it('escapes quotes and newlines in the title so the YAML stays valid', () => {
    const text = withFrontMatter('x', {
      title: 'He said "hi"\nthen left: ---',
      source: 'https://example.com/',
      date: '2026-11-05',
    });
    expect(text).toContain('title: "He said \\"hi\\"\\nthen left: ---"');
    expect(text.split('\n---\n')).toHaveLength(2);
  });
});

describe('today', () => {
  it('is the calendar date in YYYY-MM-DD', () => {
    expect(today(new Date('2026-11-05T23:59:00Z'))).toBe('2026-11-05');
  });
});
