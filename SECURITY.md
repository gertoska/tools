# Security

## Reporting a vulnerability

Please report security issues through GitHub's
[private vulnerability reporting](https://github.com/gertoska/slugify/security/advisories/new)
rather than a public issue. I will reply as soon as I can.

## What this project looks like from a security point of view

- No backend, no API, no database, no environment variables and no secrets. If this
  project ever needs a secret, something has gone wrong.
- No file upload, no `FileReader` and no loading from a URL. Typed or pasted text is
  the only input, and dropped files are refused.
- No runtime dependencies. `dependencies` in `package.json` is empty on purpose.
- Text reaches the DOM through `textContent` only. `innerHTML`, `insertAdjacentHTML`
  and `eval` are blocked by a lint rule and by the Content-Security-Policy.
- `script-src 'self'` with no `unsafe-inline` or `unsafe-eval`, and `connect-src 'none'`,
  so the page cannot make a network request after it loads.
- Shared links carry options in the URL fragment, parsed against an allow-list.
- CSV downloads prefix any cell starting with `=`, `+`, `-`, `@` or a tab with `'`.

## Scope

The tool runs entirely in the browser. There is no user data on any server to
compromise, so reports mostly concern XSS, CSP bypasses, dependency issues in the
build chain, or anything that would make text leave the page.
