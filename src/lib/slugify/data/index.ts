import { GENERIC_PACK, type LanguageCode, type LanguagePack } from '../options';

const cache = new Map<LanguageCode, LanguagePack>();

function importPack(code: Exclude<LanguageCode, 'generic'>): Promise<{ pack: LanguagePack }> {
  switch (code) {
    case 'en':
      return import('./languages/en');
    case 'es':
      return import('./languages/es');
    case 'ca':
      return import('./languages/ca');
    case 'fr':
      return import('./languages/fr');
    case 'de':
      return import('./languages/de');
    case 'it':
      return import('./languages/it');
    case 'pt':
      return import('./languages/pt');
  }
}

/** Language data is a separate chunk per language, fetched the first time it is used. */
export async function loadLanguage(code: LanguageCode): Promise<LanguagePack> {
  if (code === 'generic') return GENERIC_PACK;
  const cached = cache.get(code);
  if (cached) return cached;
  const { pack } = await importPack(code);
  cache.set(code, pack);
  return pack;
}
