/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

interface VercelHeader {
  key: string;
  value: string;
}

/**
 * `vite preview` serves the very headers Vercel will send, read from the same
 * vercel.json, so the end-to-end tests check the real Content-Security-Policy.
 */
function securityHeaders(): Plugin {
  const file = resolve(import.meta.dirname, 'vercel.json');
  const config = JSON.parse(readFileSync(file, 'utf8')) as {
    headers: { source: string; headers: VercelHeader[] }[];
  };
  const headers = config.headers.flatMap((rule) => rule.headers);

  return {
    name: 'slugify:security-headers',
    configurePreviewServer(server) {
      server.middlewares.use((_request, response, next) => {
        for (const header of headers) response.setHeader(header.key, header.value);
        next();
      });
    },
  };
}

// The site lives under https://gertoska.com/slugify/ , so the bundle is built
// straight into dist/slugify and every asset URL is already prefixed.
export default defineConfig({
  base: '/slugify/',
  plugins: [securityHeaders()],
  build: {
    outDir: 'dist/slugify',
    emptyOutDir: true,
    // Never inline assets as data: URIs; the CSP only allows data: for images
    // and inlined code would be harder to audit.
    assetsInlineLimit: 0,
    target: 'es2022',
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        privacy: resolve(import.meta.dirname, 'privacy/index.html'),
      },
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
