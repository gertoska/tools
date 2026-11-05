/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

/** Public origin, used for the sitemap. */
const SITE = 'https://gertoska.com';

/**
 * Every tool lives in a folder of its own: `<name>/index.html` plus an optional
 * `<name>/privacy/index.html`. To add one, create the folder and list it here;
 * the build input and the sitemap follow from this array.
 */
const TOOLS = ['slugify'] as const;

const root = import.meta.dirname;

interface Page {
  /** Path under the site root, always with a trailing slash. */
  route: string;
  file: string;
  changefreq: 'monthly' | 'yearly';
  priority: string;
}

const PAGES: Page[] = [
  { route: '/', file: 'index.html', changefreq: 'monthly', priority: '1.0' },
  ...TOOLS.flatMap((tool): Page[] => [
    { route: `/${tool}/`, file: `${tool}/index.html`, changefreq: 'monthly', priority: '0.9' },
    {
      route: `/${tool}/privacy/`,
      file: `${tool}/privacy/index.html`,
      changefreq: 'yearly',
      priority: '0.3',
    },
  ]),
];

interface VercelHeader {
  key: string;
  value: string;
}

/**
 * `vite preview` serves the very headers Vercel will send, read from the same
 * vercel.json, so the end-to-end tests check the real Content-Security-Policy.
 */
function securityHeaders(): Plugin {
  const config = JSON.parse(readFileSync(resolve(root, 'vercel.json'), 'utf8')) as {
    headers: { source: string; headers: VercelHeader[] }[];
  };
  const headers = config.headers.flatMap((rule) => rule.headers);

  return {
    name: 'tools:security-headers',
    configurePreviewServer(server) {
      server.middlewares.use((_request, response, next) => {
        for (const header of headers) response.setHeader(header.key, header.value);
        next();
      });
    },
  };
}

/**
 * The header and footer are written once, in src/shared/partials, and spliced
 * into each page at build time, so the output stays plain static HTML (no flash,
 * no script needed to see the page). In a page:
 *
 *   <!--@shared header brandKey="app.name" brand="Slugify"-->
 *
 * Attributes fill `{{name}}`; `{{#name}}…{{/name}}` is kept only if it is set.
 */
function sharedPartials(): Plugin {
  const directive = /<!--@shared (\w+)((?:\s+\w+="[^"]*")*)\s*-->/g;
  const attribute = /(\w+)="([^"]*)"/g;

  return {
    name: 'tools:shared-partials',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        return html.replace(directive, (_match, name: string, rawAttributes: string) => {
          const values = new Map<string, string>();
          for (const [, key, value] of rawAttributes.matchAll(attribute)) {
            if (key !== undefined && value !== undefined) values.set(key, value);
          }
          let partial = readFileSync(resolve(root, `src/shared/partials/${name}.html`), 'utf8');
          partial = partial.replace(
            /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,
            (_block, key: string, inner: string) => (values.has(key) ? inner : ''),
          );
          return partial
            .replace(/\{\{(\w+)\}\}/g, (_token, key: string) => values.get(key) ?? '')
            .trimEnd();
        });
      },
    },
  };
}

/** sitemap.xml lists every page above, so a new tool cannot be forgotten. */
function sitemap(): Plugin {
  return {
    name: 'tools:sitemap',
    generateBundle() {
      const urls = PAGES.map(
        (page) =>
          `  <url>\n    <loc>${SITE}${page.route}</loc>\n    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority}</priority>\n  </url>`,
      ).join('\n');
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
      });
    },
  };
}

export default defineConfig({
  plugins: [sharedPartials(), securityHeaders(), sitemap()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Never inline assets as data: URIs; the CSP only allows data: for images
    // and inlined code would be harder to audit.
    assetsInlineLimit: 0,
    target: 'es2022',
    rollupOptions: {
      input: Object.fromEntries(
        PAGES.map((page) => [
          page.route.slice(1, -1).replaceAll('/', '-') || 'hub',
          resolve(root, page.file),
        ]),
      ),
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
