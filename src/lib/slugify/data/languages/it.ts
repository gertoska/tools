import { it as elisions } from '../elisions/it';
import { it as stopWords } from '../stopwords/it';
import { it as symbols } from '../symbols/it';
import { it as transliteration } from '../transliteration/it';
import type { LanguagePack } from '../../options';

export const pack: LanguagePack = {
  code: 'it',
  transliteration,
  symbols,
  elisions,
  stopWords,
};
