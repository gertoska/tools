import type { SlugifySettings } from '../../../src/slugify/engine';

export interface Case {
  readonly input: string;
  readonly settings?: Partial<SlugifySettings>;
  readonly expected: string;
  readonly note?: string;
}

/** The acceptance table of the spec, plus the cases that pin each option down. */
export const cases: readonly Case[] = [
  { input: 'Café & Restaurant Guide: São Paulo', expected: 'cafe-and-restaurant-guide-sao-paulo' },
  {
    input: 'Fintech startups raised $34B in 2019',
    expected: 'fintech-startups-raised-dollar-34b-in-2019',
  },
  { input: 'Año nuevo, ¡vida nueva!', expected: 'ano-nuevo-vida-nueva' },
  { input: "Baba O'Riley — The Who", expected: 'baba-oriley-the-who' },
  { input: 'L.A. Woman', expected: 'l-a-woman' },
  { input: 'Über uns', settings: { language: 'de' }, expected: 'ueber-uns' },
  { input: 'Über uns', expected: 'uber-uns', note: 'generic language' },
  { input: 'Col·legi', settings: { language: 'ca' }, expected: 'collegi' },
  {
    input: "Col·legi d'Arquitectes",
    settings: { language: 'ca' },
    expected: 'collegi-d-arquitectes',
  },
  { input: "L'été à Paris", settings: { language: 'fr' }, expected: 'l-ete-a-paris' },
  {
    input: 'The cat and the hat',
    settings: { language: 'en', removeStopWords: true },
    expected: 'cat-hat',
  },
  {
    input: 'How to Build a Modern Website',
    settings: { maxLength: 20 },
    expected: 'how-to-build-a',
  },
  { input: 'Hello World', settings: { separator: '_' }, expected: 'hello_world' },
  { input: '日本語', expected: '', note: 'nothing transliterable' },
  { input: '\u202Eevil\u200B text', expected: 'evil-text', note: 'bidi and zero width removed' },

  // Options, one at a time.
  { input: "there's a thing", expected: 'theres-a-thing' },
  { input: 'Hello World', settings: { lowercase: false }, expected: 'Hello-World' },
  { input: 'Hello World', settings: { separator: '.' }, expected: 'hello.world' },
  { input: 'Top 10 songs of 2019', settings: { removeNumbers: true }, expected: 'top-songs-of' },
  { input: 'Rock & Roll', settings: { symbolsToWords: false }, expected: 'rock-roll' },
  { input: 'Rock & Roll', settings: { language: 'es' }, expected: 'rock-y-roll' },
  { input: '100% más café', settings: { language: 'es' }, expected: '100-por-ciento-mas-cafe' },
  { input: 'Café', settings: { transliterate: false }, expected: 'caf' },
  { input: 'L.A. Woman', settings: { removeSpecialChars: false }, expected: 'l.a-woman' },
  { input: '   Hello   ---   World   ', expected: 'hello-world' },
  { input: '--Hello--', expected: 'hello' },
  { input: '', expected: '' },
  { input: '   ', expected: '' },
  { input: 'Grüße aus Köln', settings: { language: 'de' }, expected: 'gruesse-aus-koeln' },
  { input: 'Grüße aus Köln', expected: 'grusse-aus-koln', note: 'ß is transliterated everywhere' },
  { input: 'Привет мир', expected: 'privet-mir', note: 'cyrillic' },
  { input: 'Mañana', expected: 'manana' },
  { input: 'Cinquante €', settings: { language: 'fr' }, expected: 'cinquante-euro' },
  { input: "Dell'arte e l'amore", settings: { language: 'it' }, expected: 'dell-arte-e-l-amore' },
  { input: "O'Brien's bar", settings: { language: 'en' }, expected: 'obriens-bar' },
  {
    input: 'A very long single word: supercalifragilisticexpialidocious',
    settings: { maxLength: 10 },
    expected: 'a-very',
    note: 'cut at a word boundary',
  },
  {
    input: 'supercalifragilisticexpialidocious',
    settings: { maxLength: 10 },
    expected: 'supercalif',
    note: 'only a single oversized word is cut mid-word',
  },
  {
    input: 'The and of',
    settings: { language: 'en', removeStopWords: true },
    expected: 'the-and-of',
    note: 'all stop words: the original tokens are kept',
  },
];
