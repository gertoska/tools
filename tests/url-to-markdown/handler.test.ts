import { describe, expect, it } from 'vitest';
import * as endpoint from '../../api/url-to-markdown.ts';

async function post(body: unknown, headers: Record<string, string> = {}) {
  const response = await endpoint.POST(
    new Request('https://gertoska.com/api/url-to-markdown', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  );
  return { response, body: (await response.json()) as unknown };
}

describe('POST /api/url-to-markdown', () => {
  it('answers 403 for an internal address, with the code only', async () => {
    const { response, body } = await post({ url: 'http://169.254.169.254/' });
    expect(response.status).toBe(403);
    expect(body).toEqual({ error: 'blocked' });
  });

  it.each([
    ['no url', {}],
    ['a url that is not a string', { url: 5 }],
    ['an unknown mode', { url: 'https://example.com/', mode: 'everything' }],
    ['a body that is not an object', 'null'],
    ['a body that is not JSON', 'url=https://example.com/'],
    ['a body that is far too large', { url: 'x'.repeat(10_000) }],
  ])('answers 400 for %s', async (_name, body) => {
    const { response, body: answer } = await post(body);
    expect(response.status).toBe(400);
    expect(answer).toEqual({ error: 'invalid_url' });
  });

  it('refuses a body that is not declared as JSON, which is what a cross-site form sends', async () => {
    const { response } = await post(
      { url: 'https://example.com/' },
      { 'content-type': 'text/plain' },
    );
    expect(response.status).toBe(400);
  });

  it('is never cached', async () => {
    const { response } = await post({});
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('has no GET: the address must never travel in a URL', () => {
    expect(Object.keys(endpoint)).toEqual(['POST']);
  });
});
