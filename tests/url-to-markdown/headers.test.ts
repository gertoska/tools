import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

interface Header {
  key: string;
  value: string;
}
interface Rule {
  source: string;
  headers: Header[];
}

const { headers: rules } = JSON.parse(
  readFileSync(new URL('../../vercel.json', import.meta.url), 'utf8'),
) as { headers: Rule[] };

/** Vercel path patterns, for the two forms this project uses. */
function rulesFor(path: string): Rule[] {
  return rules.filter((rule) => new RegExp(`^${rule.source}$`).test(path));
}

function csp(path: string): string {
  const matching = rulesFor(path);
  expect(matching).toHaveLength(1);
  return matching[0]?.headers.find((h) => h.key === 'Content-Security-Policy')?.value ?? '';
}

describe('security headers', () => {
  it('lets only the URL to Markdown page talk to its own server', () => {
    expect(csp('/url-to-markdown/')).toContain("connect-src 'self'");
    for (const path of ['/', '/slugify/', '/slugify/privacy/', '/api/url-to-markdown/']) {
      expect(csp(path)).toContain("connect-src 'none'");
    }
  });

  it('is otherwise the very same policy and the very same headers everywhere', () => {
    const [everywhere, tool] = rules;
    const policy = (rule?: Rule) =>
      rule?.headers.find((h) => h.key === 'Content-Security-Policy')?.value ?? '';
    expect(policy(tool).replace("connect-src 'self'", "connect-src 'none'")).toBe(
      policy(everywhere),
    );
    const others = (rule?: Rule) =>
      rule?.headers.filter((h) => h.key !== 'Content-Security-Policy');
    expect(others(tool)).toEqual(others(everywhere));
  });
});
