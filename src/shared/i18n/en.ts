/** Strings every page of the site needs: header, footer and the switchers. */
export const en = {
  'a11y.skip': 'Skip to the content',
  'lang.switcher': 'Interface language',
  'theme.toggle': 'Switch between light and dark',

  'footer.home': 'All tools',
  'footer.source': 'Source code',
  'footer.license': 'MIT licensed',
  'footer.note': 'No accounts, no cookies, no analytics, no uploads.',
} as const;

export type CommonKey = keyof typeof en;
export type CommonDictionary = Readonly<Record<CommonKey, string>>;
