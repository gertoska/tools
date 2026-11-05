import { describe, expect, it } from 'vitest';
import { neutralizeFormula, toCsv, toTxt } from '../../src/slugify/csv';
import { decodeSettings, encodeSettings } from '../../src/slugify/url-state';
import { parseSettings } from '../../src/slugify/storage';
import { DEFAULT_SETTINGS } from '../../src/slugify/engine';

describe('csv', () => {
  it('neutralises formulas', () => {
    expect(neutralizeFormula('=HYPERLINK("x")')).toBe('\'=HYPERLINK("x")');
    expect(neutralizeFormula('+1')).toBe("'+1");
    expect(neutralizeFormula('-1')).toBe("'-1");
    expect(neutralizeFormula('@user')).toBe("'@user");
    expect(neutralizeFormula('\tx')).toBe("'\tx");
    expect(neutralizeFormula('hello')).toBe('hello');
  });

  it('quotes every cell and escapes inner quotes', () => {
    const csv = toCsv(['original', 'slug'], [['=HYPERLINK("x")', 'hyperlinkx']]);
    expect(csv).toBe('"original","slug"\r\n"\'=HYPERLINK(""x"")","hyperlinkx"\r\n');
  });

  it('writes one line per slug in txt', () => {
    expect(toTxt(['a', 'b'])).toBe('a\nb\n');
  });
});

describe('url state', () => {
  it('only carries what differs from the defaults', () => {
    expect(encodeSettings(DEFAULT_SETTINGS)).toBe('');
    expect(encodeSettings({ ...DEFAULT_SETTINGS, separator: '_', maxLength: 60 })).toBe(
      'sep=_&max=60',
    );
  });

  it('round trips', () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      separator: '.' as const,
      language: 'ca' as const,
      maxLength: 60,
      lowercase: false,
      removeStopWords: true,
    };
    expect({ ...DEFAULT_SETTINGS, ...decodeSettings(`#${encodeSettings(settings)}`) }).toEqual(
      settings,
    );
  });

  it('drops unknown keys, bad values and oversized fragments', () => {
    expect(decodeSettings('#evil=<script>&sep=;&lang=xx&max=999&low=yes')).toEqual({});
    expect(decodeSettings(`#sep=_&${'x'.repeat(2_100)}`)).toEqual({});
    expect(decodeSettings('')).toEqual({});
    expect(decodeSettings('#text=my%20secret')).toEqual({});
  });

  it('keeps a valid maximum length and rejects one out of range', () => {
    expect(decodeSettings('#max=200')).toEqual({ maxLength: 200 });
    expect(decodeSettings('#max=201')).toEqual({});
  });
});

describe('stored options', () => {
  it('accepts a well formed payload', () => {
    expect(parseSettings('{"separator":"_","maxLength":60,"lowercase":false}')).toEqual({
      separator: '_',
      maxLength: 60,
      lowercase: false,
    });
  });

  it('discards anything that does not match the schema', () => {
    expect(parseSettings('not json')).toEqual({});
    expect(parseSettings('[1,2,3]')).toEqual({});
    expect(parseSettings('null')).toEqual({});
    expect(parseSettings('{"separator":"<script>","maxLength":-5,"lowercase":"yes"}')).toEqual({});
    expect(parseSettings('{"text":"a secret"}')).toEqual({});
  });
});
