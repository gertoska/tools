import { ca as elisions } from '../elisions/ca';
import { ca as stopWords } from '../stopwords/ca';
import { ca as symbols } from '../symbols/ca';
import { ca as transliteration } from '../transliteration/ca';
import type { LanguagePack } from '../../options';

export const pack: LanguagePack = {
  code: 'ca',
  transliteration,
  symbols,
  elisions,
  stopWords,
};
