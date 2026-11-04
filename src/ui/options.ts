import { byId } from './dom';
import { t } from '../i18n';
import {
  DEFAULT_SETTINGS,
  LANGUAGE_CODES,
  MAX_SLUG_LENGTH,
  SEPARATORS,
  type LanguageCode,
  type Separator,
  type SlugifySettings,
} from '../lib/slugify';
import type { Announce } from './status';
import type { Store } from './store';

const CHECKBOXES = [
  'lowercase',
  'transliterate',
  'removeSpecialChars',
  'symbolsToWords',
  'removeNumbers',
  'removeStopWords',
] as const satisfies readonly (keyof SlugifySettings)[];

export type UpdateSettings = (patch: Partial<SlugifySettings>) => void;

export function initOptions(store: Store, update: UpdateSettings, announce: Announce): void {
  const separator = byId<HTMLSelectElement>('separator');
  const language = byId<HTMLSelectElement>('language');
  const maxLength = byId<HTMLInputElement>('maxLength');
  const reset = byId<HTMLButtonElement>('reset');

  separator.addEventListener('change', () => {
    const value = separator.value;
    if ((SEPARATORS as readonly string[]).includes(value))
      update({ separator: value as Separator });
  });

  language.addEventListener('change', () => {
    const value = language.value;
    if ((LANGUAGE_CODES as readonly string[]).includes(value)) {
      update({ language: value as LanguageCode });
    }
  });

  maxLength.addEventListener('input', () => {
    const value = Number.parseInt(maxLength.value, 10);
    const clamped = Number.isFinite(value) ? Math.min(Math.max(value, 0), MAX_SLUG_LENGTH) : 0;
    update({ maxLength: clamped });
  });

  for (const key of CHECKBOXES) {
    const input = byId<HTMLInputElement>(key);
    input.addEventListener('change', () => {
      update({ [key]: input.checked });
    });
  }

  reset.addEventListener('click', () => {
    update({ ...DEFAULT_SETTINGS });
    announce(t('status.reset'));
  });

  store.subscribe(({ settings }) => {
    separator.value = settings.separator;
    language.value = settings.language;
    const asText = String(settings.maxLength);
    if (maxLength.value !== asText) maxLength.value = asText;
    for (const key of CHECKBOXES) byId<HTMLInputElement>(key).checked = settings[key];
  });
}
