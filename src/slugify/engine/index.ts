import {
  applySymbols,
  cleanTokens,
  compilePack,
  handleApostrophes,
  joinWithLimit,
  removeDigits,
  removeStopWords,
  stripDiacritics,
  stripInvisible,
  toLowerCaseSet,
  tokenize,
  transliterate,
} from './pipeline';
import {
  MAX_BULK_LINES,
  MAX_INPUT_LENGTH,
  MAX_SLUG_LENGTH,
  resolveOptions,
  type SlugifyOptions,
} from './options';

export * from './options';

function clampMaxLength(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(Math.floor(value), MAX_SLUG_LENGTH);
}

/**
 * Pure, deterministic, DOM-free. The order of the steps is part of the contract:
 * changing it changes the output.
 */
export function slugify(input: string, options?: Partial<SlugifyOptions>): string {
  const resolved = resolveOptions(options);
  const pack = compilePack(resolved.language);

  let text = input.length > MAX_INPUT_LENGTH ? input.slice(0, MAX_INPUT_LENGTH) : input;
  text = text.normalize('NFC');
  text = stripInvisible(text);

  if (resolved.symbolsToWords) {
    text = applySymbols(text, resolved.symbols ?? pack.symbols);
  }
  if (resolved.transliterate) {
    text = stripDiacritics(transliterate(text, pack.transliteration, pack.maxKeyLength));
  }
  text = handleApostrophes(text, pack.elisions);
  if (resolved.lowercase) {
    text = text.toLowerCase();
  }

  let tokens = tokenize(text, !resolved.removeSpecialChars);
  if (resolved.removeNumbers) {
    tokens = removeDigits(tokens);
  }
  if (resolved.removeStopWords) {
    const stopWords = resolved.stopWords ? toLowerCaseSet(resolved.stopWords) : pack.stopWords;
    tokens = removeStopWords(tokens, stopWords);
  }
  tokens = cleanTokens(tokens, resolved.separator);

  return joinWithLimit(tokens, resolved.separator, clampMaxLength(resolved.maxLength));
}

export interface BulkEntry {
  /** The original line, shown next to its slug. */
  readonly source: string;
  readonly slug: string;
  /** True when a suffix was added because the slug was already taken. */
  readonly deduplicated: boolean;
}

/** One line in, one slug out. With `dedupe`, repeats get `-2`, `-3`, ... */
export function slugifyMany(
  lines: readonly string[],
  options?: Partial<SlugifyOptions>,
  dedupe = false,
): BulkEntry[] {
  const resolved = resolveOptions(options);
  const used = new Map<string, number>();
  const entries: BulkEntry[] = [];

  for (const line of lines.slice(0, MAX_BULK_LINES)) {
    const slug = slugify(line, resolved);
    if (!dedupe || slug === '') {
      entries.push({ source: line, slug, deduplicated: false });
      continue;
    }
    const seen = used.get(slug) ?? 0;
    used.set(slug, seen + 1);
    if (seen === 0) {
      entries.push({ source: line, slug, deduplicated: false });
      continue;
    }
    let candidate = `${slug}${resolved.separator}${seen + 1}`;
    let attempt = seen + 1;
    while (used.has(candidate)) {
      attempt += 1;
      candidate = `${slug}${resolved.separator}${attempt}`;
    }
    used.set(candidate, 1);
    entries.push({ source: line, slug: candidate, deduplicated: true });
  }

  return entries;
}

/** Splits pasted text into lines, dropping blank ones. */
export function splitLines(text: string): string[] {
  return text
    .split(/\r\n|\r|\n/)
    .map((line) => line.trim())
    .filter((line) => line !== '');
}
