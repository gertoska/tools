/**
 * Vitest runs the TypeScript directly, so it cannot catch what broke on Vercel:
 * the function is compiled to .js and run by plain Node ESM, where an import
 * path that only works for TypeScript fails at runtime. This compiles api/ the
 * same way and exercises it: the handler, the real converter inside its
 * worker, and a page built to take minutes.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '..');
const out = mkdtempSync(join(tmpdir(), 'api-build-'));

try {
  execFileSync(
    'npx',
    [
      'tsc',
      '--ignoreConfig',
      'api/url-to-markdown.ts',
      'api/_lib/convert.ts',
      'api/_lib/errors.ts',
      'api/_lib/html-to-markdown.ts',
      'api/_lib/safe-fetch.ts',
      'api/_lib/ssrf.ts',
      'api/_lib/turndown-plugin-gfm.d.ts',
      '--outDir',
      join(out, 'api'),
      '--module',
      'nodenext',
      '--moduleResolution',
      'nodenext',
      '--target',
      'es2022',
      '--skipLibCheck',
      '--types',
      'node',
      '--esModuleInterop',
    ],
    { cwd: root, stdio: 'inherit' },
  );
  writeFileSync(join(out, 'package.json'), '{"type":"module"}');
  symlinkSync(join(root, 'node_modules'), join(out, 'node_modules'));

  const load = (file) => import(pathToFileURL(join(out, file)).href);
  const { POST } = await load('api/url-to-markdown.js');
  const { convertInWorker } = await load('api/_lib/convert.js');

  const failures = [];
  const check = (name, ok, detail = '') => {
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${name} ${detail}`);
    if (!ok) failures.push(name);
  };

  const response = await POST(
    new Request('https://x/api/url-to-markdown', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: 'http://169.254.169.254/' }),
    }),
  );
  check('compiled handler loads and blocks internal addresses', response.status === 403);

  const article = `<html><head><title>T</title></head><body><article><h1>Hi</h1><p>${'Some long article text. '.repeat(30)}<a href="/x">link</a></p><table><thead><tr><th>A</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table><pre><code class="language-js">const a = 1;</code></pre></article></body></html>`;
  let started = Date.now();
  const result = await convertInWorker(article, 'https://example.com/p/', 'main');
  check(
    'real converter runs in the worker',
    result.markdown.includes('[link](https://example.com/x)') &&
      result.markdown.includes('| A |') &&
      result.markdown.includes('```js'),
    `(${Date.now() - started} ms)`,
  );

  // 55k cells in one row (110k tags, under the cap): quadratic inside Turndown's table plugin,
  // about four seconds here. The short timeout makes the cut deterministic on any machine.
  const bomb = `<html><body><table><thead><tr><th>h</th></tr></thead><tbody><tr>${'<td>x</td>'.repeat(55_000)}</tr></tbody></table>${'text '.repeat(200)}</body></html>`;
  started = Date.now();
  let code = 'no error';
  try {
    await convertInWorker(bomb, 'https://example.com/', 'main', { timeoutMs: 1_000 });
  } catch (error) {
    code = error.code;
  }
  const took = Date.now() - started;
  check(
    'a page built to take minutes is cut off',
    code === 'too_complex' && took < 3_000,
    `(${code}, ${took} ms)`,
  );

  if (failures.length > 0) process.exitCode = 1;
} finally {
  rmSync(out, { recursive: true, force: true });
}
