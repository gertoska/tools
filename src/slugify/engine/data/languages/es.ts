import { es as elisions } from '../elisions/es';
import { es as stopWords } from '../stopwords/es';
import { es as symbols } from '../symbols/es';
import { es as transliteration } from '../transliteration/es';
import type { LanguagePack } from '../../options';

export const pack: LanguagePack = {
  code: 'es',
  transliteration,
  symbols,
  elisions,
  stopWords,
};
