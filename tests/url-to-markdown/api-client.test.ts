import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConversionError, convertUrl } from '../../src/url-to-markdown/api.ts';

function respond(body: unknown, status = 200): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status }))),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('convertUrl', () => {
  it('asks the same-origin API with the address and mode, and returns the result', async () => {
    respond({
      markdown: '# Hi',
      title: 'T',
      finalUrl: 'https://example.com/',
      usedFallback: false,
    });
    const result = await convertUrl('https://example.com/?a=b&c', 'full');
    expect(result).toEqual({
      markdown: '# Hi',
      title: 'T',
      finalUrl: 'https://example.com/',
      usedFallback: false,
    });
    const [target, init] = vi.mocked(fetch).mock.calls[0] ?? [];
    expect(target).toBe(
      `/api/url-to-markdown?url=${encodeURIComponent('https://example.com/?a=b&c')}&mode=full`,
    );
    expect(init).toMatchObject({ credentials: 'omit', cache: 'no-store' });
  });

  it.each([
    'invalid_url',
    'blocked',
    'too_many_redirects',
    'timeout',
    'too_large',
    'not_html',
    'empty_content',
    'upstream_error',
    'network',
  ])('turns the server code %s into a ConversionError', async (code) => {
    respond({ error: code }, 400);
    await expect(convertUrl('x', 'main')).rejects.toMatchObject({ code });
  });

  it('treats an unknown code, a bad body and a dead network as "unknown"', async () => {
    respond({ error: 'something new' }, 500);
    await expect(convertUrl('x', 'main')).rejects.toMatchObject({ code: 'unknown' });

    respond({ markdown: 1 });
    await expect(convertUrl('x', 'main')).rejects.toBeInstanceOf(ConversionError);

    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new TypeError('offline'))),
    );
    await expect(convertUrl('x', 'main')).rejects.toMatchObject({ code: 'unknown' });
  });
});
