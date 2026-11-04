import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, slugify, slugifyMany, splitLines, toOptions } from '../src/lib/slugify';
import { loadLanguage } from '../src/lib/slugify/data';
import { cases } from './fixtures/cases';

async function optionsFor(settings: Partial<typeof DEFAULT_SETTINGS> = {}) {
  const merged = { ...DEFAULT_SETTINGS, ...settings };
  return toOptions(merged, await loadLanguage(merged.language));
}

describe('acceptance table', () => {
  for (const testCase of cases) {
    const label = `${JSON.stringify(testCase.input)} -> ${JSON.stringify(testCase.expected)}${
      testCase.note ? ` (${testCase.note})` : ''
    }`;
    it(label, async () => {
      expect(slugify(testCase.input, await optionsFor(testCase.settings))).toBe(testCase.expected);
    });
  }
});

describe('bulk', () => {
  it('numbers duplicates when dedupe is on', async () => {
    const entries = slugifyMany(['Hello', 'hello', 'HELLO!'], await optionsFor(), true);
    expect(entries.map((entry) => entry.slug)).toEqual(['hello', 'hello-2', 'hello-3']);
    expect(entries.map((entry) => entry.deduplicated)).toEqual([false, true, true]);
  });

  it('leaves duplicates alone when dedupe is off', async () => {
    const entries = slugifyMany(['Hello', 'hello'], await optionsFor(), false);
    expect(entries.map((entry) => entry.slug)).toEqual(['hello', 'hello']);
  });

  it('uses the chosen separator for the suffix', async () => {
    const entries = slugifyMany(['Hello', 'hello'], await optionsFor({ separator: '_' }), true);
    expect(entries[1]?.slug).toBe('hello_2');
  });

  it('never collides with a slug that already ends in a number', async () => {
    const entries = slugifyMany(['Hello', 'hello 2', 'hello', 'hello'], await optionsFor(), true);
    expect(entries.map((entry) => entry.slug)).toEqual(['hello', 'hello-2', 'hello-3', 'hello-4']);
  });

  it('keeps empty slugs empty', async () => {
    const entries = slugifyMany(['日本語', '日本語'], await optionsFor(), true);
    expect(entries.map((entry) => entry.slug)).toEqual(['', '']);
  });

  it('splits and trims lines', () => {
    expect(splitLines('a\r\nb\n\n  c  \n')).toEqual(['a', 'b', 'c']);
  });
});
