import { ca } from './ca';
import { en, type Dictionary, type MessageKey as ToolKey } from './en';
import { es } from './es';
import { COMMON_MESSAGES, createI18n } from '../../shared/i18n';
import type { CommonKey } from '../../shared/i18n/en';

export type MessageKey = ToolKey | CommonKey;

const dictionaries: Readonly<Record<'en' | 'es' | 'ca', Dictionary>> = { en, es, ca };

export const { t, getLocale, setLocale, applyLocale } = createI18n<MessageKey>({
  en: { ...COMMON_MESSAGES.en, ...dictionaries.en },
  es: { ...COMMON_MESSAGES.es, ...dictionaries.es },
  ca: { ...COMMON_MESSAGES.ca, ...dictionaries.ca },
});

export const i18n = { getLocale, setLocale };
