# Security

## Reporting a vulnerability

Please report security issues through GitHub's
[private vulnerability reporting](https://github.com/gertoska/slugify/security/advisories/new)
rather than a public issue. I will reply as soon as I can.

## What this project looks like from a security point of view

- No database, no environment variables and no secrets. If this project ever needs a
  secret, something has gone wrong.
- One server function, `api/url-to-markdown.ts`, which fetches a URL the visitor chose.
  That is a server-side request forgery risk, so it is the most reviewed code here: scheme,
  port and credentials are checked, every resolved IP is checked when connecting (not
  before, so DNS rebinding cannot swap it), redirects are followed by hand and checked
  again, and time, size and content type are limited. It answers with an error code only,
  sets `no-store`, and neither stores nor logs addresses or content.
- The parser is synchronous, so no timeout on its own thread can interrupt it, and some pages
  (very deep nesting, a table row of tens of thousands of cells) make it take minutes. A
  linear scan of the tags refuses the worst before parsing, and the conversion itself runs in
  a worker thread that is terminated after 4 seconds and limited in memory.
- The endpoint takes POST with a JSON body only. A cross-origin page cannot call it from a
  visitor's browser (that would need a preflight, which is never answered), and the address
  never appears in a URL, so it is not in the platform's request logs.
- Requests identify themselves as `gertoska-tools/1.0 (+https://gertoska.com/url-to-markdown/)`
  so the owner of a site that sees them knows where to report abuse. They are GETs only.
- A request a browser reports as cross-site (`Sec-Fetch-Site`) is refused, and answers carry
  `Cross-Origin-Resource-Policy: same-origin`.
- Converted Markdown is untrusted text. Pasted into an LLM, a page can carry prompt
  injection: that is inherent to the tool, and the page is never rendered as HTML.
- Rate limiting is a Vercel Firewall rule, set up in the dashboard (see the README).
- No file upload and no `FileReader`. Typed or pasted text is the only input, and dropped
  files are refused.
- Runtime dependencies exist only for that function (`undici`, `linkedom`,
  `@mozilla/readability`, `turndown`), and none ships to the browser.
- Text reaches the DOM through `textContent` only. `innerHTML`, `insertAdjacentHTML`
  and `eval` are blocked by a lint rule and by the Content-Security-Policy.
- `script-src 'self'` with no `unsafe-inline` or `unsafe-eval`. `connect-src` is `'none'`
  everywhere except the URL to Markdown page, where it is `'self'`.
- The converted Markdown is shown in a textarea as text, never rendered as HTML.
- Shared links carry options in the URL fragment, parsed against an allow-list.
- CSV downloads prefix any cell starting with `=`, `+`, `-`, `@` or a tab with `'`.

## Scope

Slugify runs entirely in the browser. There is no user data on any server to
compromise, so reports mostly concern XSS, CSP bypasses, dependency issues in the
build chain, or anything that would make text leave the page. For URL to Markdown, anything
that makes the function reach a private or internal address is in scope and urgent.
