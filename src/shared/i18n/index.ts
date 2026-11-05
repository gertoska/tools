import { ca } from './ca';
import { en } from './en';
import { es } from './es';
import { loadLocale, saveLocale } from '../storage';

export const LOCALES = ['en', 'es', 'ca'] as const;
export type Locale = (typeof LOCALES)[number];

/** The messages every page shares; each tool spreads these into its own. */
export const COMMON_MESSAGES = { en, es, ca } as const;

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

/** What the language switcher needs, whatever the page's own message keys are. */
export interface LocaleController {
  getLocale: () => Locale;
  setLocale: (locale: Locale) => void;
}

export interface I18n<Key extends string> extends LocaleController {
  t: (key: Key, params?: Readonly<Record<string, string | number>>) => string;
  applyLocale: (locale: Locale, root?: ParentNode) => void;
}

/**
 * One instance per page group (the hub, each tool). The static HTML is written
 * in English; applyLocale swaps every marked node for the chosen language.
 * Always textContent, never innerHTML.
 */
export function createI18n<Key extends string>(
  dictionaries: Readonly<Record<Locale, Readonly<Record<Key, string>>>>,
): I18n<Key> {
  let current: Locale = 'en';

  const t: I18n<Key>['t'] = (key, params) => {
    const template = dictionaries[current][key];
    if (!params) return template;
    return Object.entries(params).reduce(
      (text, [name, value]) => text.split(`{${name}}`).join(String(value)),
      template,
    );
  };

  const isKey = (key: string): key is Key => Object.hasOwn(dictionaries.en, key);

  const applyLocale: I18n<Key>['applyLocale'] = (locale, root = document) => {
    current = locale;
    if (root === document) {
      document.documentElement.lang = locale;
      document.title = t('document.title' as Key);
    }

    for (const element of root.querySelectorAll<HTMLElement>('[data-i18n]')) {
      const key = element.dataset['i18n'];
      if (key !== undefined && isKey(key)) element.textContent = t(key);
    }
    for (const element of root.querySelectorAll<HTMLElement>('[data-i18n-aria-label]')) {
      const key = element.dataset['i18nAriaLabel'];
      if (key !== undefined && isKey(key)) element.setAttribute('aria-label', t(key));
    }
    for (const element of root.querySelectorAll<HTMLElement>('[data-i18n-placeholder]')) {
      const key = element.dataset['i18nPlaceholder'];
      if (key !== undefined && isKey(key) && 'placeholder' in element) {
        (element as HTMLInputElement | HTMLTextAreaElement).placeholder = t(key);
      }
    }
  };

  return {
    t,
    applyLocale,
    getLocale: () => current,
    setLocale: (locale) => {
      applyLocale(locale);
      saveLocale(locale);
    },
  };
}
