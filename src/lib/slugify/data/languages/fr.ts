import { fr as elisions } from '../elisions/fr';
import { fr as stopWords } from '../stopwords/fr';
import { fr as symbols } from '../symbols/fr';
import { fr as transliteration } from '../transliteration/fr';
import type { LanguagePack } from '../../options';

export const pack: LanguagePack = {
  code: 'fr',
  transliteration,
  symbols,
  elisions,
  stopWords,
};
