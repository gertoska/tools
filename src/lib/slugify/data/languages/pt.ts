import { pt as elisions } from '../elisions/pt';
import { pt as stopWords } from '../stopwords/pt';
import { pt as symbols } from '../symbols/pt';
import { pt as transliteration } from '../transliteration/pt';
import type { LanguagePack } from '../../options';

export const pack: LanguagePack = {
  code: 'pt',
  transliteration,
  symbols,
  elisions,
  stopWords,
};
