import {
  DEFAULT_SETTINGS,
  LANGUAGE_CODES,
  MAX_SLUG_LENGTH,
  SEPARATORS,
  type LanguageCode,
  type Separator,
  type SlugifySettings,
} from './engine/options';

/**
 * The shareable link carries the options and never the text: the fragment is
 * not sent to any server, but a URL still ends up in history and in chats.
 */
const MAX_FRAGMENT_LENGTH = 2_000;

const BOOLEAN_KEYS = {
  low: 'lowercase',
  tr: 'transliterate',
  sp: 'removeSpecialChars',
  sym: 'symbolsToWords',
  num: 'removeNumbers',
  stop: 'removeStopWords',
} as const satisfies Record<string, keyof SlugifySettings>;

export function encodeSettings(settings: SlugifySettings): string {
  const params = new URLSearchParams();
  if (settings.separator !== DEFAULT_SETTINGS.separator) params.set('sep', settings.separator);
  if (settings.language !== DEFAULT_SETTINGS.language) params.set('lang', settings.language);
  if (settings.maxLength !== DEFAULT_SETTINGS.maxLength) {
    params.set('max', String(settings.maxLength));
  }
  for (const [short, key] of Object.entries(BOOLEAN_KEYS)) {
    if (settings[key] !== DEFAULT_SETTINGS[key]) params.set(short, settings[key] ? '1' : '0');
  }
  return params.toString();
}

function isSeparator(value: string): value is Separator {
  return (SEPARATORS as readonly string[]).includes(value);
}

function isLanguageCode(value: string): value is LanguageCode {
  return (LANGUAGE_CODES as readonly string[]).includes(value);
}

/**
 * Allow-list parse: anything unknown, malformed or oversized is dropped rather
 * than trusted. Never returns a value the UI could not have produced itself.
 */
export function decodeSettings(fragment: string): Partial<SlugifySettings> {
  const raw = fragment.startsWith('#') ? fragment.slice(1) : fragment;
  if (raw === '' || raw.length > MAX_FRAGMENT_LENGTH) return {};

  let params: URLSearchParams;
  try {
    params = new URLSearchParams(raw);
  } catch {
    return {};
  }

  const settings: Partial<SlugifySettings> = {};

  const separator = params.get('sep');
  if (separator !== null && isSeparator(separator)) settings.separator = separator;

  const language = params.get('lang');
  if (language !== null && isLanguageCode(language)) settings.language = language;

  const maxLength = params.get('max');
  if (maxLength !== null && /^\d{1,3}$/.test(maxLength)) {
    const value = Number(maxLength);
    if (value >= 0 && value <= MAX_SLUG_LENGTH) settings.maxLength = value;
  }

  for (const [short, key] of Object.entries(BOOLEAN_KEYS)) {
    const value = params.get(short);
    if (value === '1' || value === '0') settings[key] = value === '1';
  }

  return settings;
}
