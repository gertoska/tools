import {
  DEFAULT_SETTINGS,
  LANGUAGE_CODES,
  MAX_SLUG_LENGTH,
  SEPARATORS,
  type SlugifySettings,
} from './engine/options';
import { isRecord, readString, removeKey, writeString } from '../shared/storage';

/** Options only: never the text. Theme and language live in shared/storage. */
const OPTIONS_KEY = 'slugify:v1:options';

/** Anything that does not match the schema is discarded, not repaired. */
export function parseSettings(raw: string | null): Partial<SlugifySettings> {
  if (raw === null) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  if (!isRecord(parsed)) return {};

  const settings: Partial<SlugifySettings> = {};
  const { separator, language, maxLength } = parsed;

  if (typeof separator === 'string' && (SEPARATORS as readonly string[]).includes(separator)) {
    settings.separator = separator as SlugifySettings['separator'];
  }
  if (typeof language === 'string' && (LANGUAGE_CODES as readonly string[]).includes(language)) {
    settings.language = language as SlugifySettings['language'];
  }
  if (
    typeof maxLength === 'number' &&
    Number.isInteger(maxLength) &&
    maxLength >= 0 &&
    maxLength <= MAX_SLUG_LENGTH
  ) {
    settings.maxLength = maxLength;
  }
  for (const key of [
    'lowercase',
    'transliterate',
    'removeSpecialChars',
    'symbolsToWords',
    'removeNumbers',
    'removeStopWords',
  ] as const) {
    const value = parsed[key];
    if (typeof value === 'boolean') settings[key] = value;
  }
  return settings;
}

export function loadSettings(): SlugifySettings {
  return { ...DEFAULT_SETTINGS, ...parseSettings(readString(OPTIONS_KEY)) };
}

export function saveSettings(settings: SlugifySettings): void {
  writeString(OPTIONS_KEY, JSON.stringify(settings));
}

export function clearSettings(): void {
  removeKey(OPTIONS_KEY);
}
