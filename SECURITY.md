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
