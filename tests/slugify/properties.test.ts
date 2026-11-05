import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, MAX_SLUG_LENGTH, slugify, toOptions } from '../../src/slugify/engine';
import { loadLanguage } from '../../src/slugify/engine/data';
import type { SlugifySettings } from '../../src/slugify/engine';

/** Deterministic pseudo-random generator: a failure is always reproducible. */
function createRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1_103_515_245 + 12_345) % 2_147_483_648;
    return state / 2_147_483_648;
  };
}

const ALPHABET = [
  ...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  ...' \t\n-_.!?,:;/\\()[]{}"\'’&$%@+=#*~^<>|`',
  ...'áéíóúñÑçÇüÜßäöÄÖåøæœÆŒłđþðĳ',
  ...'日本語中文한국어',
  ...'ПриветмирЖЩЪЫЬЭЮЯ',
  '\u00B7',
  '\u200B',
  '\u202E',
  '\u00AD',
  '\uFEFF',
  '\u0000',
  '\u001F',
];

function randomString(random: () => number, maxLength: number): string {
  const length = Math.floor(random() * maxLength);
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += ALPHABET[Math.floor(random() * ALPHABET.length)] ?? '';
  }
  return out;
}

const VARIANTS: readonly Partial<SlugifySettings>[] = [
  {},
  { separator: '_' },
  { separator: '.' },
  { lowercase: false },
  { removeNumbers: true },
  { removeStopWords: true, language: 'en' },
  { removeStopWords: true, language: 'es' },
  { symbolsToWords: false },
  { transliterate: false },
  { removeSpecialChars: false },
  { maxLength: 20 },
  { maxLength: 7, separator: '_' },
  { language: 'de' },
  { language: 'ca' },
  { language: 'fr' },
  { language: 'it' },
  { language: 'pt' },
];

describe('properties', () => {
  it('holds over 2000 random inputs', async () => {
    const random = createRandom(20_261_104);
    const resolved = await Promise.all(
      VARIANTS.map(async (variant) => {
        const settings = { ...DEFAULT_SETTINGS, ...variant };
        return {
          settings,
          options: toOptions(settings, await loadLanguage(settings.language)),
        };
      }),
    );

    for (let i = 0; i < 2_000; i += 1) {
      const input = randomString(random, 80);
      for (const { settings, options } of resolved) {
        const slug = slugify(input, options);
        const label = `${JSON.stringify(input)} with ${JSON.stringify(settings)} gave ${slug}`;

        // Never starts or ends with a separator, and never repeats one.
        expect(slug.startsWith(settings.separator), label).toBe(false);
        expect(slug.endsWith(settings.separator), label).toBe(false);
        expect(slug.includes(settings.separator + settings.separator), label).toBe(false);

        // Stays inside the maximum length.
        if (settings.maxLength > 0)
          expect(slug.length, label).toBeLessThanOrEqual(settings.maxLength);

        // Only the allowed characters.
        if (settings.removeSpecialChars) {
          const allowed = settings.lowercase ? /^[a-z0-9\-_.]*$/ : /^[A-Za-z0-9\-_.]*$/;
          expect(allowed.test(slug), label).toBe(true);
        }
        expect(/^[\x20-\x7E]*$/.test(slug), label).toBe(true);

        // Idempotent: slugging a slug changes nothing.
        expect(slugify(slug, options), label).toBe(slug);
      }
    }
  });

  it('never exceeds the maximum slug length, whatever is asked for', async () => {
    const options = toOptions(
      { ...DEFAULT_SETTINGS, maxLength: 9_999 },
      await loadLanguage('generic'),
    );
    const slug = slugify('word '.repeat(500), options);
    expect(slug.length).toBeLessThanOrEqual(MAX_SLUG_LENGTH);
  });
});

describe('performance', () => {
  it('handles 100k characters well under a second', async () => {
    const options = toOptions(DEFAULT_SETTINGS, await loadLanguage('de'));
    const input = 'Großes Café & Restaurant Guide: São Paulo 2019 — '.repeat(2_100);
    expect(input.length).toBeGreaterThan(100_000);

    const started = performance.now();
    const slug = slugify(input, options);
    const elapsed = performance.now() - started;

    expect(slug.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(1_000);
  });

  it('is not slowed down by long runs of separators (no catastrophic backtracking)', async () => {
    const options = toOptions(DEFAULT_SETTINGS, await loadLanguage('generic'));
    const started = performance.now();
    slugify(`${'-'.repeat(50_000)}a${'-'.repeat(50_000)}`, options);
    expect(performance.now() - started).toBeLessThan(500);
  });
});
