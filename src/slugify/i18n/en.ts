export const en = {
  'document.title': 'Slugify — free URL slug generator, runs in your browser',
  'app.name': 'Slugify',
  'app.tagline':
    'Turn any title into a clean URL slug. Free, no sign-up, and your text never leaves this page.',

  'tabs.label': 'Mode',
  'tabs.single': 'One',
  'tabs.bulk': 'Many',

  'input.label': 'Your text',
  'input.placeholder': 'Type or paste a title…',
  'examples.label': 'Try one:',
  'action.clear': 'Clear',

  'result.label': 'Slug',
  'result.placeholder': 'Your slug shows up here',
  'result.empty': 'Nothing left to use: none of those characters could be turned into a–z or 0–9.',
  'counter.characters': '{n} characters',
  'counter.seoWarning': 'Long for a URL — under 60 characters reads better in search results.',
  'action.copy': 'Copy',
  'action.copyPath': 'Copy as /path',
  'action.copyLink': 'Copy link',

  'status.copied': 'Slug copied',
  'status.copiedPath': 'Path copied',
  'status.copiedLink': 'Link copied. It carries your options, never your text.',
  'status.copiedAll': 'All slugs copied',
  'status.copyFailed':
    'Could not reach the clipboard. Select the text and copy it with your keyboard.',
  'status.downloaded': 'File downloaded',
  'status.cleared': 'Cleared',
  'status.reset': 'Options back to their defaults',
  'status.nothingToCopy': 'Nothing to copy yet',

  'options.legend': 'Options',
  'options.separator': 'Separator',
  'options.separator.dash': 'Hyphen ( - )',
  'options.separator.underscore': 'Underscore ( _ )',
  'options.separator.dot': 'Dot ( . )',
  'options.lowercase': 'Lowercase',
  'options.transliterate': 'Transliterate accents (é → e)',
  'options.removeSpecial': 'Remove special characters',
  'options.symbols': 'Symbols to words (& → and)',
  'options.removeNumbers': 'Remove numbers',
  'options.advanced': 'Advanced options',
  'options.language': 'Content language',
  'options.language.hint':
    'Picks the transliteration table, the symbol words and the stop word list.',
  'options.stopwords': 'Remove stop words',
  'options.maxLength': 'Maximum length',
  'options.maxLength.hint': '0 means no limit. Cuts at a word boundary.',
  'action.reset': 'Reset options',

  'lang.generic': 'Generic',
  'lang.en': 'English',
  'lang.es': 'Spanish',
  'lang.ca': 'Catalan',
  'lang.fr': 'French',
  'lang.de': 'German',
  'lang.it': 'Italian',
  'lang.pt': 'Portuguese',

  'bulk.label': 'One line, one slug',
  'bulk.placeholder': 'One title per line…',
  'bulk.dedupe': 'Number repeated slugs ( -2, -3 )',
  'bulk.copyAll': 'Copy all',
  'bulk.downloadTxt': 'Download .txt',
  'bulk.downloadCsv': 'Download .csv',
  'bulk.columnOriginal': 'Original',
  'bulk.columnSlug': 'Slug',
  'bulk.empty': 'Paste a list of titles to see one slug per line.',
  'bulk.summary': '{n} lines',
  'bulk.summaryDuplicates': '{n} lines, {d} numbered as repeats',
  'bulk.truncated': 'Only the first {n} lines are processed.',
  'bulk.duplicateBadge': 'repeat',

  'faq.title': 'Questions',
  'faq.q1': 'Hyphen or underscore?',
  'faq.a1':
    'Hyphen. Search engines read a hyphen as a word break and an underscore as a joiner, so my-blog-post counts as three words and my_blog_post as one.',
  'faq.q2': 'How long should a slug be?',
  'faq.a2':
    'Short enough to read whole in a search result. Under 60 characters is a sensible ceiling, and three to five meaningful words beat a full sentence.',
  'faq.q3': 'What are stop words?',
  'faq.a3':
    'Small words like the, of or and that carry little meaning on their own. Dropping them shortens a slug without losing its subject, although it can make a title read oddly.',
  'faq.q4': 'What does transliterating do?',
  'faq.a4':
    'It rewrites letters outside a–z as their closest ASCII match: é becomes e, ß becomes ss, ñ becomes n. Accented URLs do work, but they get percent-encoded the moment they are copied.',
  'faq.q5': 'Does my text leave the browser?',
  'faq.a5':
    'No. There is no server, no upload and no analytics. Open DevTools → Network and type: not a single request goes out.',
  'faq.q6': 'Can I upload a file?',
  'faq.a6':
    'No, on purpose. Typing and pasting are the only ways in, which keeps the whole tool to one small, auditable surface.',

  'footer.privacy': 'Privacy',

  'privacy.title': 'Privacy',
  'privacy.back': 'Back to the tool',
  'privacy.intro':
    'Slugify is a static page. It has no server of its own, no database and no analytics, so there is nothing to collect.',
  'privacy.h1': 'What happens to your text',
  'privacy.p1':
    'It stays in the tab. Slugs are built by JavaScript running in your browser, and the text is never sent anywhere, never stored and never written to the clipboard unless you click a copy button.',
  'privacy.h2': 'How to check that yourself',
  'privacy.p2':
    "Open DevTools → Network, then type in the tool. Nothing appears. The page also ships a Content-Security-Policy with connect-src 'none', which forbids the page from making any network request at all after it loads.",
  'privacy.h3': 'What is stored on your device',
  'privacy.p3':
    'Your options, your theme and your interface language, in localStorage, so the tool opens the way you left it. Never your text. Reset options removes them.',
  'privacy.h4': 'Cookies and third parties',
  'privacy.p4':
    'None. No cookies, no fonts, scripts or frames from other domains, no analytics and no ads — including Vercel Analytics and Speed Insights.',
  'privacy.h5': 'Shareable links',
  'privacy.p5':
    'Copy link puts your options in the part of the URL after the # sign, which browsers never send to a server. Your text is not included.',
  'privacy.h6': 'Hosting',
  'privacy.p6':
    'The site is served as static files by Vercel, which processes connection data such as your IP address in order to deliver the page, as any web host does.',
} as const;

export type MessageKey = keyof typeof en;
export type Dictionary = Readonly<Record<MessageKey, string>>;
