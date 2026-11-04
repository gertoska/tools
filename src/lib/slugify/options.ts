export const LANGUAGE_CODES = ['generic', 'en', 'es', 'ca', 'fr', 'de', 'it', 'pt'] as const;
export type LanguageCode = (typeof LANGUAGE_CODES)[number];

export const SEPARATORS = ['-', '_', '.'] as const;
export type Separator = (typeof SEPARATORS)[number];

/** Anything longer is cut before processing, so a paste cannot freeze the tab. */
export const MAX_INPUT_LENGTH = 100_000;
/** Upper bound of the "max length" option. 0 means no limit. */
export const MAX_SLUG_LENGTH = 200;
/** Lines processed in bulk mode. */
export const MAX_BULK_LINES = 5_000;

/** Everything the engine needs to know about one content language. */
export interface LanguagePack {
  readonly code: LanguageCode;
  readonly transliteration: Readonly<Record<string, string>>;
  readonly symbols: Readonly<Record<string, string>>;
  readonly elisions: readonly string[];
  readonly stopWords: readonly string[];
}

export const GENERIC_PACK: LanguagePack = {
  code: 'generic',
  transliteration: {},
  symbols: {},
  elisions: [],
  stopWords: [],
};

export interface SlugifyOptions {
  separator: Separator;
  lowercase: boolean;
  /** Content language; only its data is used, never the UI language. */
  language: LanguagePack;
  transliterate: boolean;
  removeSpecialChars: boolean;
  symbolsToWords: boolean;
  removeNumbers: boolean;
  removeStopWords: boolean;
  /** 0 = no limit. */
  maxLength: number;
  /** Replaces the language list when present (editable list in the UI). */
  stopWords?: readonly string[];
  /** Replaces the language map when present. */
  symbols?: Readonly<Record<string, string>>;
}

export const DEFAULT_OPTIONS: SlugifyOptions = {
  separator: '-',
  lowercase: true,
  language: GENERIC_PACK,
  transliterate: true,
  removeSpecialChars: true,
  symbolsToWords: true,
  removeNumbers: false,
  removeStopWords: false,
  maxLength: 0,
};

export function resolveOptions(options?: Partial<SlugifyOptions>): SlugifyOptions {
  return options ? { ...DEFAULT_OPTIONS, ...options } : DEFAULT_OPTIONS;
}

/** The part of the options the UI persists and shares: plain, serialisable values. */
export interface SlugifySettings {
  separator: Separator;
  lowercase: boolean;
  language: LanguageCode;
  transliterate: boolean;
  removeSpecialChars: boolean;
  symbolsToWords: boolean;
  removeNumbers: boolean;
  removeStopWords: boolean;
  maxLength: number;
}

export const DEFAULT_SETTINGS: SlugifySettings = {
  separator: '-',
  lowercase: true,
  language: 'generic',
  transliterate: true,
  removeSpecialChars: true,
  symbolsToWords: true,
  removeNumbers: false,
  removeStopWords: false,
  maxLength: 0,
};

export function toOptions(settings: SlugifySettings, pack: LanguagePack): SlugifyOptions {
  return {
    separator: settings.separator,
    lowercase: settings.lowercase,
    language: pack,
    transliterate: settings.transliterate,
    removeSpecialChars: settings.removeSpecialChars,
    symbolsToWords: settings.symbolsToWords,
    removeNumbers: settings.removeNumbers,
    removeStopWords: settings.removeStopWords,
    maxLength: settings.maxLength,
  };
}
