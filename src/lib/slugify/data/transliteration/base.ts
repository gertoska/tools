import { cyrillic } from './cyrillic';

/**
 * Characters that survive NFD + combining-mark removal and would otherwise be
 * dropped. Language tables are applied before this one and win on conflicts.
 */
export const baseTransliteration: Readonly<Record<string, string>> = {
  ß: 'ss',
  ẞ: 'Ss',
  æ: 'ae',
  Æ: 'Ae',
  œ: 'oe',
  Œ: 'Oe',
  ø: 'o',
  Ø: 'O',
  đ: 'd',
  Đ: 'D',
  ð: 'd',
  Ð: 'D',
  þ: 'th',
  Þ: 'Th',
  ł: 'l',
  Ł: 'L',
  ı: 'i',
  İ: 'I',
  ħ: 'h',
  Ħ: 'H',
  ŧ: 't',
  Ŧ: 'T',
  ƒ: 'f',
  ȷ: 'j',
  ŋ: 'ng',
  Ŋ: 'Ng',
  ª: 'a',
  º: 'o',
  ...cyrillic,
};
