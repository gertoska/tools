import { de as elisions } from '../elisions/de';
import { de as stopWords } from '../stopwords/de';
import { de as symbols } from '../symbols/de';
import { de as transliteration } from '../transliteration/de';
import type { LanguagePack } from '../../options';

export const pack: LanguagePack = {
  code: 'de',
  transliteration,
  symbols,
  elisions,
  stopWords,
};
