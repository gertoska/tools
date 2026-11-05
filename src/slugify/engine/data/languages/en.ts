import { en as elisions } from '../elisions/en';
import { en as stopWords } from '../stopwords/en';
import { en as symbols } from '../symbols/en';
import { en as transliteration } from '../transliteration/en';
import type { LanguagePack } from '../../options';

export const pack: LanguagePack = {
  code: 'en',
  transliteration,
  symbols,
  elisions,
  stopWords,
};
