import {
  DEFAULT_SETTINGS,
  LANGUAGE_CODES,
  MAX_SLUG_LENGTH,
  SEPARATORS,
  type SlugifySettings,
} from './slugify/options';

/**
 * localStorage is shared with the rest of gertoska.com, so the key is namespaced
 * and whatever comes back is validated before use. Options only: never the text.
 */
const OPTIONS_KEY = 'slugify:v1:options';
const THEME_KEY = 'slugify:v1:theme';
const LOCALE_KEY = 'slugify:v1:locale';

function readString(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeString(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* Private mode or a full quota: the app works without persistence. */
  }
}

function removeKey(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

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

export type ThemePreference = 'system' | 'light' | 'dark';

export function loadTheme(): ThemePreference {
  const value = readString(THEME_KEY);
  return value === 'light' || value === 'dark' ? value : 'system';
}

export function saveTheme(theme: ThemePreference): void {
  if (theme === 'system') removeKey(THEME_KEY);
  else writeString(THEME_KEY, theme);
}

export function loadLocale(): string | null {
  return readString(LOCALE_KEY);
}

export function saveLocale(locale: string): void {
  writeString(LOCALE_KEY, locale);
}
