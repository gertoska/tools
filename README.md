# Tools

Small, free web tools. The hub lives at `/` and each tool in its own folder.

| Tool            | URL                                       | Where it runs                                     |
| --------------- | ----------------------------------------- | ------------------------------------------------- |
| Slugify         | **https://gertoska.com/slugify/**         | Entirely in your browser                          |
| URL to Markdown | **https://gertoska.com/url-to-markdown/** | In the browser, plus one server function to fetch |

No accounts, no ads and no analytics. Slugify has no backend at all: the text you type
never leaves the page. URL to Markdown is the exception, and says so on its own page: the
address you enter is sent to a Vercel Function that downloads the page and returns
Markdown. Nothing is stored or logged.

## URL to Markdown

Paste an address, get the page as Markdown: the main content (Readability) or the full
page, copy it or download a `.md` file with optional front matter.

- `api/url-to-markdown.ts`, one Vercel Function: `POST { url, mode: "main" | "full" }`. The
  address is in the body, not the query string, because request logs keep URLs and not bodies
- `api/_lib/ssrf.ts` and `safe-fetch.ts`: http(s) on ports 80 and 443 only, no credentials,
  every resolved IP checked at connect time (private, loopback, link-local and IPv6
  equivalents are refused), at most 3 redirects each checked again, 8 s and 2 MB limits,
  HTML only
- `api/_lib/html-to-markdown.ts`: linkedom, Readability and Turndown with GFM tables. Pages
  nested or tagged beyond a budget are refused up front (parsing is synchronous, so a timeout
  cannot stop it), and every attribute Markdown cannot use is stripped
- Pages that need JavaScript to show their text are out of scope and report an error
- `vercel.json` lets only `/url-to-markdown/` call its own origin (`connect-src 'self'`);
  every other page keeps `connect-src 'none'`

### Rate limiting (set in the Vercel dashboard, not in the repo)

The function does no limiting of its own: serverless instances share no memory, so a counter
inside it would not count. The limit is one Vercel Firewall rate-limit rule, which the Hobby
plan allows (one rule per project, counted by IP, fixed window). Without it the endpoint is a
free fetcher for anyone, so create it before announcing the tool:

1. Project → Firewall → Configure → Add New Rule → Rate Limiting.
2. Condition: **Request Path** equals `/api/url-to-markdown`.
3. Key **IP address**, fixed window **60 s**, limit **10** requests.
4. Action: **Log** for the first day to see real traffic, then **Too many requests (429)**
   (the page shows a "too many requests" message) or **Deny** if the dashboard asks for Pro to use 429.
5. Publish the change.

## Slugify: what it does

- Live preview while you type, copy in one click, copy as `/path`
- Separator `-`, `_` or `.`, lowercase on or off
- Transliteration to ASCII, per language (`ß` → `ss`, `ü` → `ue` in German, `l·l` → `ll` in Catalan, Cyrillic → Latin)
- Symbols to words (`&` → and, `$` → dollar, `%` → percent), in seven languages
- Apostrophes removed (`there's` → `theres`), except after an elided particle in French, Catalan and Italian (`l'été` → `l-ete`)
- Stop words per language, remove numbers, maximum length cut at a word boundary
- Bulk mode: one line, one slug, with repeats numbered `-2`, `-3`, and `.txt` / `.csv` download
- Character counter with an SEO warning past 60 characters
- Shareable link that carries your options and never your text
- English, Spanish and Catalan on the same URL, light and dark, keyboard accessible

## Running it

```bash
npm ci
npm run dev      # http://localhost:5173/   (hub)  and  /slugify/
```

`npm run dev` serves the pages only; `/api` is not available there, and the end-to-end
tests answer for it. To run the function too, use `npx vercel dev`.

| Command                    | What it does                                                                      |
| -------------------------- | --------------------------------------------------------------------------------- |
| `npm run dev`              | Dev server                                                                        |
| `npm run build`            | Typecheck, then build into `dist/`                                                |
| `npm run preview`          | Serve the build with the production security headers                              |
| `npm test`                 | Engine tests, property tests and performance budgets (Vitest)                     |
| `npm run test:e2e`         | Build, then end-to-end tests in Chromium, Firefox, WebKit and mobile (Playwright) |
| `npm run lint`             | ESLint, including the rules that forbid `innerHTML` and friends                   |
| `npm run typecheck`        | TypeScript in strict mode                                                         |
| `npm run test:all`         | Everything above                                                                  |
| `node scripts/make-og.mjs` | Rebuild `public/slugify/og.png`                                                   |

## How it is put together

HTML, CSS and TypeScript with no UI framework, built by Vite into static files.
**Zero runtime dependencies**: `dependencies` in `package.json` is empty, and it should
stay that way.

```text
index.html                 the hub: one card per tool
<tool>/index.html          a tool's page (static HTML, in English)
<tool>/privacy/index.html  its privacy page
src/
  shared/                  everything every tool reuses
    partials/              header.html and footer.html, spliced in at build time
    styles/                CSS variables and the base styles (shell, buttons, switchers)
    i18n/                  EN/ES/CA strings common to all pages and createI18n()
    storage.ts             schema-checked localStorage for theme and language
    theme.ts, language-switcher.ts, dom.ts
  hub/                     the hub's script, strings and styles
  slugify/
    main.ts, privacy.ts    entry points
    ui/                    store, tabs, single mode, bulk mode, options, clipboard
    i18n/                  this tool's strings (merged with the shared ones)
    styles/tool.css        styles only this tool needs
    engine/                THE ENGINE: pure, no DOM, no dependencies
      index.ts             slugify() and slugifyMany()
      pipeline.ts          the steps of the algorithm
      options.ts           types and defaults
      data/                transliteration, stop words, symbols and elisions per language
    url-state.ts           allow-list (de)serialisation of the shareable state
    storage.ts             schema-checked localStorage for this tool's options
    csv.ts                 CSV with formula injection neutralised
public/                    favicon.svg, and <tool>/og.png per tool
tests/
  slugify/                 engine, property and library tests (Vitest) and the shared cases
  e2e/<tool>/, e2e/hub/    Playwright
```

`src/slugify/engine` imports nothing from the UI and touches no DOM, so it can be tested in
isolation, moved into a worker or published separately.

### Adding a tool

1. Create `<tool>/index.html` (and `<tool>/privacy/index.html` if it needs one), using
   `<!--@shared header …-->` and `<!--@shared footer …-->` for the shell, and
   `src/<tool>/` for its code. Import `shared/styles/*.css`, then its own styles.
2. Build its i18n with `createI18n` from `src/shared/i18n`, spreading `COMMON_MESSAGES`.
3. Add it to `TOOLS` in `vite.config.ts` (`privacyPage: false` if it has none). That adds
   its pages to the build and to `sitemap.xml`. A tool that needs the network gets its own
   `source` rule in `vercel.json`, and the catch-all rule must exclude it.
4. Add a card in the root `index.html` and its strings in `src/hub/i18n.ts`.

### The pipeline

The order of these steps is part of the contract; changing it changes the output.

1. Cap the input length and normalise to NFC
2. Strip control, zero-width and bidi characters
3. Symbols to words, surrounded by separators
4. Transliterate: the language table first, then NFD with combining marks removed
5. Apostrophes: removed, or kept as a separator after an elided particle
6. Lowercase, if the option is on
7. Tokenise on anything outside `[A-Za-z0-9]`
8. Remove numbers, if the option is on
9. Remove stop words, keeping the original tokens if nothing would be left
10. Join with the separator and trim the ends
11. Apply the maximum length at a word boundary

Language data (transliteration tables, stop words, symbol maps, elisions) is one lazily
imported chunk per language, so the initial JavaScript stays around 12 KB gzipped.

## Deploying

Static files plus one serverless function (`api/`), and no environment variables.

- `vite.config.ts` builds the hub and every tool into `dist/` (`base: '/'`), so Vercel serves
  `/`, `/slugify/` and the rest with no rewrites. The sitemap is generated from the same list.
- `vercel.json` carries the security headers for every route.
- In Vercel (Hobby plan): Framework Preset **Vite**, Build Command `npm run build`,
  Output Directory `dist`. `main` deploys to production, pull requests get previews.
- If `gertoska.com` still points at another Vercel project, that project must rewrite every
  path this one serves to `https://<this-project>.vercel.app`: `/`, `/<tool>/:path*`,
  `/assets/:path*`, `/api/:path*`, `/favicon.svg` and `/sitemap.xml`. Assets are shared between tools, so
  they no longer live under a tool's prefix.

### Content-Security-Policy

`script-src 'self'` with no `unsafe-inline` and no `unsafe-eval`, plus `connect-src 'none'`,
which makes it impossible for the page to send anything anywhere after it loads. That is
what makes the privacy promise checkable rather than a claim. In practice it means: no
inline scripts or styles, no `style` attributes in the HTML, and styling from TypeScript
through classes or `element.style`, never `setAttribute('style', …)`.

`npm run preview` and the end-to-end tests serve the very headers from `vercel.json`, so a
policy that would break in production breaks in CI first.

## Still to come

Bulk mode, duplicate numbering, downloads, the shareable link and the length counter are
already here. Editable stop word and symbol lists, the equivalent code snippet, keyboard
shortcuts, a "keep Unicode" mode and offline use are not.

## Licence

MIT. See [LICENSE](LICENSE). Security reports: [SECURITY.md](SECURITY.md).
