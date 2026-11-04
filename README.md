# Slugify

A free URL slug generator that runs entirely in your browser.

**https://gertoska.com/slugify/**

No accounts, no limits, no ads, no analytics and no uploads. The text you type never
leaves the page: there is no backend to send it to.

## What it does

- Live preview while you type, copy in one click, copy as `/path`
- Separator `-`, `_` or `.`, lowercase on or off
- Transliteration to ASCII, per language (`ß` → `ss`, `ü` → `ue` in German, `l·l` → `ll` in Catalan, Cyrillic → Latin)
- Symbols to words (`&` → and, `$` → dollar, `%` → percent), in seven languages
- Apostrophes removed (`there's` → `theres`), except after an elided particle in French, Catalan and Italian (`l'été` → `l-ete`)
- Stop words per language, remove numbers, maximum length cut at a word boundary
- Bulk mode: one line, one slug, with repeats numbered `-2`, `-3`, and `.txt` / `.csv` download
- Character counter with an SEO warning past 60 characters
- Shareable link that carries your options and never your text
- English and Spanish on the same URL, light and dark, keyboard accessible

## Running it

```bash
npm ci
npm run dev      # http://localhost:5173/slugify/
```

| Command                    | What it does                                                                      |
| -------------------------- | --------------------------------------------------------------------------------- |
| `npm run dev`              | Dev server                                                                        |
| `npm run build`            | Typecheck, then build into `dist/slugify/`                                        |
| `npm run preview`          | Serve the build with the production security headers                              |
| `npm test`                 | Engine tests, property tests and performance budgets (Vitest)                     |
| `npm run test:e2e`         | Build, then end-to-end tests in Chromium, Firefox, WebKit and mobile (Playwright) |
| `npm run lint`             | ESLint, including the rules that forbid `innerHTML` and friends                   |
| `npm run typecheck`        | TypeScript in strict mode                                                         |
| `npm run test:all`         | Everything above                                                                  |
| `node scripts/make-og.mjs` | Rebuild `public/og.png`                                                           |

## How it is put together

HTML, CSS and TypeScript with no UI framework, built by Vite into static files.
**Zero runtime dependencies**: `dependencies` in `package.json` is empty, and it should
stay that way.

```text
index.html             the tool, the FAQ and the examples (static HTML, in English)
privacy/index.html     the privacy page
src/
  main.ts              startup: language, theme, store, views
  ui/                  store, tabs, single mode, bulk mode, options, theme, clipboard
  styles/              CSS variables, layout, components
  i18n/                en.ts, es.ts and the locale runtime
  lib/
    slugify/           THE ENGINE: pure, no DOM, no dependencies
      index.ts         slugify() and slugifyMany()
      pipeline.ts      the steps of the algorithm
      options.ts       types and defaults
      data/            transliteration, stop words, symbols and elisions per language
    url-state.ts       allow-list (de)serialisation of the shareable state
    storage.ts         schema-checked localStorage
    csv.ts             CSV with formula injection neutralised
tests/
  fixtures/            the shared table of cases
  e2e/                 Playwright
```

`src/lib/slugify` imports nothing from the UI and touches no DOM, so it can be tested in
isolation, moved into a worker or published separately.

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

Static files only: no servers, no serverless functions, no environment variables.

- `vite.config.ts` sets `base: '/slugify/'` and `build.outDir: 'dist/slugify'`, so the
  build already sits under `/slugify/` and Vercel serves it with no rewrites.
- `vercel.json` carries the security headers and redirects `/` to `/slugify/`.
- In Vercel (Hobby plan): Framework Preset **Vite**, Build Command `npm run build`,
  Output Directory `dist`. `main` deploys to production, pull requests get previews.
- If `gertoska.com` already points at another Vercel project, that project adds a rewrite
  from `/slugify/:path*` to `https://<this-project>.vercel.app/slugify/:path*`.

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
