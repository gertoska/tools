/**
 * localStorage is shared by every tool on the site (and with the rest of
 * gertoska.com), so keys are namespaced and whatever comes back is validated
 * before use. Preferences only: never anything the visitor typed.
 */
export function readString(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeString(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* Private mode or a full quota: the app works without persistence. */
  }
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Theme and language are one choice for the whole site. Slugify used to keep
// its own copy, so those keys are still read once as a fallback.
const THEME_KEY = 'tools:v1:theme';
const LOCALE_KEY = 'tools:v1:locale';
const LEGACY_THEME_KEY = 'slugify:v1:theme';
const LEGACY_LOCALE_KEY = 'slugify:v1:locale';

export type ThemePreference = 'system' | 'light' | 'dark';

export function loadTheme(): ThemePreference {
  const value = readString(THEME_KEY) ?? readString(LEGACY_THEME_KEY);
  return value === 'light' || value === 'dark' ? value : 'system';
}

export function saveTheme(theme: ThemePreference): void {
  if (theme === 'system') removeKey(THEME_KEY);
  else writeString(THEME_KEY, theme);
  removeKey(LEGACY_THEME_KEY);
}

export function loadLocale(): string | null {
  return readString(LOCALE_KEY) ?? readString(LEGACY_LOCALE_KEY);
}

export function saveLocale(locale: string): void {
  writeString(LOCALE_KEY, locale);
  removeKey(LEGACY_LOCALE_KEY);
}
