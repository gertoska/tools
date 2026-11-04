import { ca } from './ca';
import { en, type Dictionary, type MessageKey } from './en';
import { es } from './es';
import { loadLocale, saveLocale } from '../lib/storage';

export const LOCALES = ['en', 'es', 'ca'] as const;
export type Locale = (typeof LOCALES)[number];

const DICTIONARIES: Readonly<Record<Locale, Dictionary>> = { en, es, ca };

let current: Locale = 'en';

export function getLocale(): Locale {
  return current;
}

export function t(key: MessageKey, params?: Readonly<Record<string, string | number>>): string {
  const template = DICTIONARIES[current][key];
  if (!params) return template;
  return Object.entries(params).reduce(
    (text, [name, value]) => text.split(`{${name}}`).join(String(value)),
    template,
  );
}

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** Stored preference first, then the browser, and English for anything else. */
export function detectLocale(): Locale {
  const stored = loadLocale();
  if (stored !== null && isLocale(stored)) return stored;
  const languages =
    typeof navigator === 'undefined' ? [] : (navigator.languages ?? [navigator.language]);
  for (const tag of languages) {
    const base = tag.toLowerCase().split('-')[0] ?? '';
    if (isLocale(base)) return base;
  }
  return 'en';
}

function isMessageKey(key: string): key is MessageKey {
  return Object.hasOwn(en, key);
}

/**
 * The static HTML is written in English; this swaps every marked node when the
 * resolved language is Spanish. Always textContent, never innerHTML.
 */
export function applyLocale(locale: Locale, root: ParentNode = document): void {
  current = locale;
  if (root === document) {
    document.documentElement.lang = locale;
    document.title = t('document.title');
  }

  for (const element of root.querySelectorAll<HTMLElement>('[data-i18n]')) {
    const key = element.dataset['i18n'];
    if (key !== undefined && isMessageKey(key)) element.textContent = t(key);
  }
  for (const element of root.querySelectorAll<HTMLElement>('[data-i18n-aria-label]')) {
    const key = element.dataset['i18nAriaLabel'];
    if (key !== undefined && isMessageKey(key)) element.setAttribute('aria-label', t(key));
  }
  for (const element of root.querySelectorAll<HTMLElement>('[data-i18n-placeholder]')) {
    const key = element.dataset['i18nPlaceholder'];
    if (key !== undefined && isMessageKey(key) && 'placeholder' in element) {
      (element as HTMLInputElement | HTMLTextAreaElement).placeholder = t(key);
    }
  }
}

export function setLocale(locale: Locale): void {
  applyLocale(locale);
  saveLocale(locale);
}
