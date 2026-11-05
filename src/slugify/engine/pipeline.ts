import { baseSymbols } from './data/symbols/base';
import { baseTransliteration } from './data/transliteration/base';
import type { LanguagePack } from './options';

/** Control characters: turned into a space so they cannot glue two words. */
// eslint-disable-next-line no-control-regex -- matching control characters is the point
const CONTROL = /[\u0000-\u001F\u007F-\u009F]/g;
/** Zero width, soft hyphen and bidi overrides: removed outright. */
const INVISIBLE = /[\u00AD\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u206A-\u206F\uFEFF]/g;
/** Combining marks left behind by NFD. */
// eslint-disable-next-line no-misleading-character-class -- the marks are what we strip
const COMBINING = /[\u0300-\u036F\u1AB0-\u1AFF\u1DC0-\u1DFF\u20D0-\u20F0\uFE20-\uFE2F]/g;

const APOSTROPHES = ['\u0027', '\u2019', '\u2018', '\u02BC', '\u02B9', '\u2032'].join('');
/** Kept inside a token when "remove special characters" is off: URL-safe ASCII. */
const EXTRA_ALLOWED = "~!$&'()*+,;=:@._-";
/** Characters that can act as a separator and must never touch a token edge. */
const SEPARATOR_CHARS = '-_.';

export function stripInvisible(text: string): string {
  return text.replace(CONTROL, ' ').replace(INVISIBLE, '');
}

/** `$34B` -> ` dollar 34B`: the word is surrounded by separators. */
export function applySymbols(text: string, map: Readonly<Record<string, string>>): string {
  let out = '';
  for (let i = 0; i < text.length; i += 1) {
    const char = text.charAt(i);
    const word = map[char];
    out += word === undefined ? char : ` ${word} `;
  }
  return out;
}

/** Longest match first, so `l·l` wins over `l`. */
export function transliterate(
  text: string,
  table: Readonly<Record<string, string>>,
  maxKeyLength: number,
): string {
  let out = '';
  let i = 0;
  while (i < text.length) {
    let matched = false;
    const max = Math.min(maxKeyLength, text.length - i);
    for (let length = max; length >= 1; length -= 1) {
      const replacement = table[text.slice(i, i + length)];
      if (replacement !== undefined) {
        out += replacement;
        i += length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      out += text.charAt(i);
      i += 1;
    }
  }
  return out;
}

/** Drops accents that no table covered: `é` -> `e`. */
export function stripDiacritics(text: string): string {
  return text.normalize('NFD').replace(COMBINING, '').normalize('NFC');
}

function isAsciiLetter(code: number): boolean {
  return (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
}

function isAsciiAlphanumeric(code: number): boolean {
  return (code >= 48 && code <= 57) || isAsciiLetter(code);
}

/**
 * Apostrophes disappear (`there's` -> `theres`) unless they follow an elided
 * particle in French, Catalan or Italian, where they separate (`l'été` -> `l-ete`).
 */
export function handleApostrophes(text: string, elisions: ReadonlySet<string>): string {
  let out = '';
  for (let i = 0; i < text.length; i += 1) {
    const char = text.charAt(i);
    if (!APOSTROPHES.includes(char)) {
      out += char;
      continue;
    }
    let start = out.length;
    while (start > 0 && isAsciiLetter(out.charCodeAt(start - 1))) start -= 1;
    out += elisions.has(out.slice(start).toLowerCase()) ? ' ' : '';
  }
  return out;
}

export function tokenize(text: string, keepSpecialChars: boolean): string[] {
  const tokens: string[] = [];
  let current = '';
  for (let i = 0; i < text.length; i += 1) {
    const char = text.charAt(i);
    if (
      isAsciiAlphanumeric(char.charCodeAt(0)) ||
      (keepSpecialChars && EXTRA_ALLOWED.includes(char))
    ) {
      current += char;
    } else if (current !== '') {
      tokens.push(current);
      current = '';
    }
  }
  if (current !== '') tokens.push(current);
  return tokens;
}

export function removeDigits(tokens: readonly string[]): string[] {
  const out: string[] = [];
  for (const token of tokens) {
    let stripped = '';
    for (let i = 0; i < token.length; i += 1) {
      const code = token.charCodeAt(i);
      if (code < 48 || code > 57) stripped += token.charAt(i);
    }
    if (stripped !== '') out.push(stripped);
  }
  return out;
}

/** Keeps the original tokens when every one of them is a stop word. */
export function removeStopWords(
  tokens: readonly string[],
  stopWords: ReadonlySet<string>,
): string[] {
  if (stopWords.size === 0) return [...tokens];
  const kept = tokens.filter((token) => !stopWords.has(token.toLowerCase()));
  return kept.length > 0 ? kept : [...tokens];
}

/** No token may start or end with a separator, or hold a repeated one. */
function cleanToken(token: string, separator: string): string {
  let out = '';
  for (let i = 0; i < token.length; i += 1) {
    const char = token.charAt(i);
    if (char === separator && out.endsWith(separator)) continue;
    out += char;
  }
  let start = 0;
  let end = out.length;
  while (start < end && SEPARATOR_CHARS.includes(out.charAt(start))) start += 1;
  while (end > start && SEPARATOR_CHARS.includes(out.charAt(end - 1))) end -= 1;
  return out.slice(start, end);
}

export function cleanTokens(tokens: readonly string[], separator: string): string[] {
  const out: string[] = [];
  for (const token of tokens) {
    const cleaned = cleanToken(token, separator);
    if (cleaned !== '') out.push(cleaned);
  }
  return out;
}

/**
 * Joins and applies the maximum length at a word boundary. A single word longer
 * than the maximum is the only case that gets cut mid-word.
 */
export function joinWithLimit(
  tokens: readonly string[],
  separator: string,
  maxLength: number,
): string {
  if (maxLength <= 0) return tokens.join(separator);
  let out = '';
  for (const token of tokens) {
    const next = out === '' ? token : out + separator + token;
    if (next.length > maxLength) break;
    out = next;
  }
  const first = tokens[0];
  if (out === '' && first !== undefined) out = first.slice(0, maxLength);
  let end = out.length;
  while (end > 0 && SEPARATOR_CHARS.includes(out.charAt(end - 1))) end -= 1;
  return out.slice(0, end);
}

interface CompiledPack {
  transliteration: Readonly<Record<string, string>>;
  maxKeyLength: number;
  symbols: Readonly<Record<string, string>>;
  elisions: ReadonlySet<string>;
  stopWords: ReadonlySet<string>;
}

const compiled = new WeakMap<LanguagePack, CompiledPack>();

/** Merging the tables once per language keeps bulk runs cheap. */
export function compilePack(pack: LanguagePack): CompiledPack {
  const cached = compiled.get(pack);
  if (cached) return cached;
  const transliteration = { ...baseTransliteration, ...pack.transliteration };
  let maxKeyLength = 1;
  for (const key of Object.keys(transliteration)) {
    if (key.length > maxKeyLength) maxKeyLength = key.length;
  }
  const value: CompiledPack = {
    transliteration,
    maxKeyLength,
    symbols: { ...baseSymbols, ...pack.symbols },
    elisions: new Set(pack.elisions),
    stopWords: new Set(pack.stopWords.map((word) => word.toLowerCase())),
  };
  compiled.set(pack, value);
  return value;
}

const customSets = new WeakMap<object, ReadonlySet<string>>();

export function toLowerCaseSet(words: readonly string[]): ReadonlySet<string> {
  const key = words as unknown as object;
  const cached = customSets.get(key);
  if (cached) return cached;
  const set = new Set(words.map((word) => word.trim().toLowerCase()).filter(Boolean));
  customSets.set(key, set);
  return set;
}
