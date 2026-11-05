import { describe, expect, it } from 'vitest';
import { GET } from '../../api/url-to-markdown.ts';

async function call(query: string) {
  const response = await GET(new Request(`https://gertoska.com/api/url-to-markdown${query}`));
  return { response, body: (await response.json()) as unknown };
}

describe('GET /api/url-to-markdown', () => {
  it('answers 400 when the url is missing', async () => {
    const { response, body } = await call('');
    expect(response.status).toBe(400);
    expect(body).toEqual({ error: 'invalid_url' });
  });

  it('answers 403 for an internal address, with the code only', async () => {
    const { response, body } = await call(`?url=${encodeURIComponent('http://169.254.169.254/')}`);
    expect(response.status).toBe(403);
    expect(body).toEqual({ error: 'blocked' });
  });

  it('is never cached', async () => {
    const { response } = await call('');
    expect(response.headers.get('cache-control')).toBe('no-store');
  });
});
