export const en = {
  'document.title': 'URL to Markdown — turn any web page into clean Markdown',
  'app.name': 'URL to Markdown',
  'app.tagline':
    'Paste a web address and get the page as clean Markdown. Free, no sign-up. Unlike the other tools here, it needs our server to fetch the page.',

  'input.label': 'Web address',
  'input.placeholder': 'https://example.com/blog/post',
  'mode.legend': 'What to convert',
  'mode.main': 'Main content only',
  'mode.full': 'Full page',
  'action.convert': 'Convert',
  'action.converting': 'Converting…',
  'notice.privacy':
    'To read the page, the address you enter is sent to this site’s server, which downloads it for you. Addresses and page contents are not stored or logged.',

  'result.label': 'Markdown',
  'result.placeholder': 'The Markdown shows up here. You can edit it before copying.',
  'result.fallback': 'No article found on this page, so the whole page was converted.',
  'result.source': 'Source: {url}',
  'counter.characters': '{n} characters',
  'action.copy': 'Copy',
  'action.download': 'Download .md',
  'option.frontMatter': 'Add front matter (title, source, date) to the download',

  'status.converting': 'Converting the page',
  'status.done': 'Markdown ready',
  'status.copied': 'Markdown copied',
  'status.copyFailed':
    'Could not reach the clipboard. Select the text and copy it with your keyboard.',
  'status.downloaded': 'File downloaded',

  'error.invalid_url': 'That does not look like a valid web address.',
  'error.blocked':
    'That address cannot be fetched. Only public websites on the standard web ports are allowed.',
  'error.too_many_redirects': 'The page redirected too many times.',
  'error.timeout': 'The page took too long to answer.',
  'error.too_large': 'The page is too large. The limit is 2 MB.',
  'error.not_html': 'That address is not a web page: it did not return HTML.',
  'error.empty_content':
    'No readable text found. Pages that build their content with JavaScript are not supported.',
  'error.too_complex': 'The page is too complex to convert safely.',
  'error.upstream_error': 'The site answered with an error.',
  'error.network': 'Could not reach the site.',
  'error.rate_limited': 'Too many requests. Wait a minute and try again.',
  'error.unknown': 'Something went wrong. Try again in a moment.',

  'about.title': 'Good to know',
  'about.body':
    'It works with public pages that deliver their text as HTML. Pages that need JavaScript to show their content, pages behind a login and pages over 2 MB are not supported.',

  'footer.privacy': 'Privacy',
} as const;

export type MessageKey = keyof typeof en;
export type Dictionary = Readonly<Record<MessageKey, string>>;
