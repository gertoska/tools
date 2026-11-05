import { describe, expect, it } from 'vitest';
import { convertInWorker } from '../../api/_lib/convert.js';

const converter = (name: string) =>
  new URL(`./fixtures/converters/${name}.mjs`, import.meta.url).href;

async function codeOf(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
  } catch (error) {
    return (error as { code?: string }).code ?? 'unexpected';
  }
  return 'no error';
}

describe('convertInWorker', () => {
  it('returns what the converter returns, arguments included', async () => {
    const result = await convertInWorker('<p>hi</p>', 'https://example.com/', 'full', {
      moduleUrl: converter('ok'),
    });
    expect(result).toEqual({
      markdown: 'full:https://example.com/:<p>hi</p>',
      title: 'T',
      usedFallback: false,
    });
  });

  it('stops a converter that never returns, which no timer on its own thread could do', async () => {
    const started = Date.now();
    const code = await codeOf(
      convertInWorker('x', 'https://example.com/', 'main', {
        moduleUrl: converter('spin'),
        timeoutMs: 300,
      }),
    );
    expect(code).toBe('too_complex');
    expect(Date.now() - started).toBeLessThan(3_000);
  });

  it('answers while the main thread stays free to do other work', async () => {
    let ticks = 0;
    const timer = setInterval(() => ticks++, 20);
    await codeOf(
      convertInWorker('x', 'https://example.com/', 'main', {
        moduleUrl: converter('spin'),
        timeoutMs: 400,
      }),
    );
    clearInterval(timer);
    expect(ticks).toBeGreaterThan(5);
  });

  it('turns a crash in the converter into too_complex', async () => {
    expect(
      await codeOf(
        convertInWorker('x', 'https://example.com/', 'main', { moduleUrl: converter('throws') }),
      ),
    ).toBe('too_complex');
  });

  it('keeps empty_content as it is', async () => {
    expect(
      await codeOf(
        convertInWorker('x', 'https://example.com/', 'main', { moduleUrl: converter('empty') }),
      ),
    ).toBe('empty_content');
  });

  it('survives a converter that tries to eat all the memory', async () => {
    expect(
      await codeOf(
        convertInWorker('x', 'https://example.com/', 'main', {
          moduleUrl: converter('memory'),
          timeoutMs: 10_000,
        }),
      ),
    ).toBe('too_complex');
  });

  it('treats a converter that cannot be loaded as too_complex', async () => {
    expect(
      await codeOf(
        convertInWorker('x', 'https://example.com/', 'main', {
          moduleUrl: converter('does-not-exist'),
        }),
      ),
    ).toBe('too_complex');
  });
});
