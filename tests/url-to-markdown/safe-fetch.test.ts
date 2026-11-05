import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { fetchHtml, type SafeFetchOptions } from '../../api/_lib/safe-fetch.ts';

const LOOPBACK = '127.0.0.1';

let server: Server;
let port: number;

beforeAll(async () => {
  server = createServer((request, response) => {
    const html = { 'content-type': 'text/html; charset=utf-8' };
    switch (request.url) {
      case '/ok':
        response.writeHead(200, html).end('<h1>Hello</h1>');
        break;
      case '/latin1':
        response
          .writeHead(200, { 'content-type': 'text/html; charset=iso-8859-1' })
          .end(Buffer.from([0x63, 0x61, 0x66, 0xe9]));
        break;
      case '/meta-charset':
        response
          .writeHead(200, { 'content-type': 'text/html' })
          .end(Buffer.from('<meta charset="iso-8859-1">caf\xe9', 'latin1'));
        break;
      case '/redirect':
        response.writeHead(302, { location: '/ok' }).end();
        break;
      case '/redirect-3':
        response.writeHead(302, { location: '/redirect-2' }).end();
        break;
      case '/redirect-2':
        response.writeHead(302, { location: '/redirect' }).end();
        break;
      case '/loop':
        response.writeHead(302, { location: '/loop' }).end();
        break;
      case '/to-metadata':
        response.writeHead(302, { location: 'http://169.254.169.254/latest/meta-data/' }).end();
        break;
      case '/to-other-port':
        response.writeHead(302, { location: 'http://example.test:8080/' }).end();
        break;
      case '/to-ftp':
        response.writeHead(302, { location: 'ftp://example.test/' }).end();
        break;
      case '/no-location':
        response.writeHead(302).end();
        break;
      case '/not-found':
        response.writeHead(404, html).end('nope');
        break;
      case '/json':
        response.writeHead(200, { 'content-type': 'application/json' }).end('{}');
        break;
      case '/no-type':
        response.writeHead(200).end('<h1>x</h1>');
        break;
      case '/huge-declared':
        response.writeHead(200, { ...html, 'content-length': '999999999' });
        response.end('x');
        break;
      case '/huge-stream': {
        // No Content-Length: only counting the bytes can stop this one.
        response.writeHead(200, html);
        const chunk = Buffer.alloc(16 * 1024, 'a');
        const timer = setInterval(() => response.write(chunk), 1);
        response.on('close', () => clearInterval(timer));
        break;
      }
      case '/slow-headers':
        break; // never answers
      case '/slow-body':
        response.writeHead(200, html);
        response.write('<p>start');
        break; // never finishes
      default:
        response.writeHead(404).end();
    }
  });
  await new Promise<void>((done) => server.listen(0, LOOPBACK, done));
  port = (server.address() as AddressInfo).port;
});

afterAll(async () => {
  server.closeAllConnections();
  await new Promise<void>((done) => server.close(() => done()));
});

/** Reaches the local server through a made-up host name that "resolves" to loopback. */
function options(extra: SafeFetchOptions = {}): SafeFetchOptions {
  return {
    allowedPorts: [port, 80],
    resolve: () => Promise.resolve([{ address: LOOPBACK, family: 4 }]),
    isAllowedAddress: (address) => address === LOOPBACK,
    ...extra,
  };
}

const url = (path: string) => `http://example.test:${port}${path}`;

async function codeOf(path: string, extra?: SafeFetchOptions): Promise<string> {
  try {
    await fetchHtml(url(path), options(extra));
  } catch (error) {
    return (error as { code?: string }).code ?? 'unexpected';
  }
  return 'no error';
}

describe('fetchHtml: happy path', () => {
  it('returns the page and its final URL', async () => {
    const result = await fetchHtml(url('/ok'), options());
    expect(result).toEqual({ html: '<h1>Hello</h1>', finalUrl: url('/ok') });
  });

  it('follows a redirect and reports where it ended', async () => {
    const result = await fetchHtml(url('/redirect'), options());
    expect(result.finalUrl).toBe(url('/ok'));
    expect(result.html).toBe('<h1>Hello</h1>');
  });

  it('follows exactly the allowed number of redirects', async () => {
    // /redirect-3 -> /redirect-2 -> /redirect -> /ok is three hops.
    const result = await fetchHtml(url('/redirect-3'), options());
    expect(result.finalUrl).toBe(url('/ok'));
  });

  it('decodes the charset from the header and from <meta>', async () => {
    expect((await fetchHtml(url('/latin1'), options())).html).toBe('café');
    expect((await fetchHtml(url('/meta-charset'), options())).html).toContain('café');
  });
});

describe('fetchHtml: redirects', () => {
  it('stops after too many redirects', async () => {
    expect(await codeOf('/redirect-3', { maxRedirects: 2 })).toBe('too_many_redirects');
    expect(await codeOf('/loop')).toBe('too_many_redirects');
  });

  it('blocks a redirect to the cloud metadata address', async () => {
    expect(await codeOf('/to-metadata')).toBe('blocked');
  });

  it('blocks a redirect to another port', async () => {
    expect(await codeOf('/to-other-port')).toBe('blocked');
  });

  it('rejects a redirect to another scheme', async () => {
    expect(await codeOf('/to-ftp')).toBe('invalid_url');
  });

  it('fails cleanly on a redirect with no Location', async () => {
    expect(await codeOf('/no-location')).toBe('upstream_error');
  });
});

describe('fetchHtml: the response', () => {
  it('rejects error statuses', async () => {
    expect(await codeOf('/not-found')).toBe('upstream_error');
  });

  it('rejects anything that is not HTML', async () => {
    expect(await codeOf('/json')).toBe('not_html');
    expect(await codeOf('/no-type')).toBe('not_html');
  });

  it('rejects a body that declares it is too large without reading it', async () => {
    expect(await codeOf('/huge-declared', { maxBytes: 1024 })).toBe('too_large');
  });

  it('stops a body that is too large and does not say so', async () => {
    expect(await codeOf('/huge-stream', { maxBytes: 64 * 1024 })).toBe('too_large');
  });

  it('times out a server that never answers', async () => {
    expect(await codeOf('/slow-headers', { timeoutMs: 200 })).toBe('timeout');
  });

  it('times out a server that stops in the middle of the body', async () => {
    expect(await codeOf('/slow-body', { timeoutMs: 200 })).toBe('timeout');
  });
});

describe('fetchHtml: addresses', () => {
  it('refuses a name that resolves to a private address', async () => {
    const resolve = () => Promise.resolve([{ address: '10.0.0.5', family: 4 }]);
    await expect(fetchHtml('https://intranet.example.com/', { resolve })).rejects.toMatchObject({
      code: 'blocked',
    });
  });

  it('refuses a name when only one of its answers is private', async () => {
    const resolve = () =>
      Promise.resolve([
        { address: '93.184.216.34', family: 4 },
        { address: '192.168.0.10', family: 4 },
      ]);
    await expect(fetchHtml('https://mixed.example.com/', { resolve })).rejects.toMatchObject({
      code: 'blocked',
    });
  });

  it('refuses a name that resolves to IPv6 loopback or an IPv4-mapped one', async () => {
    for (const address of ['::1', '::ffff:127.0.0.1']) {
      const resolve = () => Promise.resolve([{ address, family: 6 }]);
      await expect(fetchHtml('https://v6.example.com/', { resolve })).rejects.toMatchObject({
        code: 'blocked',
      });
    }
  });

  it('resolves again on every request, so a changed answer is checked again', async () => {
    let calls = 0;
    const resolve = () =>
      Promise.resolve([{ address: calls++ === 0 ? LOOPBACK : '169.254.169.254', family: 4 }]);
    const settings = options({ resolve, isAllowedAddress: (a) => a === LOOPBACK });
    await expect(fetchHtml(url('/ok'), settings)).resolves.toBeDefined();
    await expect(fetchHtml(url('/ok'), settings)).rejects.toMatchObject({ code: 'blocked' });
  });

  it('blocks localhost with the real resolver and the real rules', async () => {
    await expect(fetchHtml('http://localhost/')).rejects.toMatchObject({ code: 'blocked' });
  });

  it('blocks IP literals before any lookup happens', async () => {
    await expect(fetchHtml('http://169.254.169.254/')).rejects.toMatchObject({ code: 'blocked' });
    await expect(fetchHtml('http://2130706433/')).rejects.toMatchObject({ code: 'blocked' });
    await expect(fetchHtml('http://[::1]/')).rejects.toMatchObject({ code: 'blocked' });
  });

  it('reports an unreachable host as a network error', async () => {
    const resolve = () => Promise.reject(Object.assign(new Error('x'), { code: 'ENOTFOUND' }));
    await expect(fetchHtml('https://nowhere.example.com/', { resolve })).rejects.toMatchObject({
      code: 'network',
    });
  });
});
