import { Worker } from 'node:worker_threads';
import { FetchError } from './errors.js';
import { htmlToMarkdown, type ConvertMode, type ConvertResult } from './html-to-markdown.js';

/** Real pages convert in well under a second; this is the hard stop for the rest. */
const DEFAULT_TIMEOUT_MS = 4_000;

/**
 * The converter is synchronous, and some inputs make it take minutes (a table
 * row with tens of thousands of cells is quadratic inside Turndown's GFM
 * plugin, for one). A timer cannot interrupt synchronous code on the thread
 * that runs it, but terminating a worker thread does, so conversion runs there.
 *
 * The worker loads the converter by URL, so it is also imported statically
 * below: that is what makes the bundler compile and ship the file.
 */
export const CONVERTER_URL = new URL('./html-to-markdown.js', import.meta.url).href;
export { htmlToMarkdown };

const WORKER_SOURCE = `
const { parentPort, workerData } = require('node:worker_threads');
const fail = (code) => parentPort.postMessage({ ok: false, code });
import(workerData.moduleUrl).then(
  (converter) => {
    try {
      const result = converter.htmlToMarkdown(workerData.html, workerData.pageUrl, workerData.mode);
      parentPort.postMessage({ ok: true, result });
    } catch (error) {
      fail(error && error.name === 'FetchError' ? error.code : 'too_complex');
    }
  },
  () => fail('too_complex'),
);
`;

export interface ConvertOptions {
  timeoutMs?: number;
  /** Where the worker loads the converter from. Tests point it at a stand-in. */
  moduleUrl?: string;
}

type WorkerMessage = { ok: true; result: ConvertResult } | { ok: false; code: string };

function isMessage(value: unknown): value is WorkerMessage {
  if (typeof value !== 'object' || value === null) return false;
  const message = value as Record<string, unknown>;
  return typeof message['ok'] === 'boolean';
}

/** Only these two can come out of a conversion; anything else means "could not convert". */
function conversionError(code: unknown): FetchError {
  return new FetchError(code === 'empty_content' ? 'empty_content' : 'too_complex');
}

export function convertInWorker(
  html: string,
  pageUrl: string,
  mode: ConvertMode,
  { timeoutMs = DEFAULT_TIMEOUT_MS, moduleUrl = CONVERTER_URL }: ConvertOptions = {},
): Promise<ConvertResult> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(WORKER_SOURCE, {
      eval: true,
      workerData: { html, pageUrl, mode, moduleUrl },
      // A page cannot make the function run out of memory either.
      resourceLimits: { maxOldGenerationSizeMb: 256, maxYoungGenerationSizeMb: 32 },
    });

    let settled = false;
    const settle = (outcome: () => void): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      void worker.terminate();
      outcome();
    };

    const timer = setTimeout(() => {
      settle(() => {
        reject(new FetchError('too_complex'));
      });
    }, timeoutMs);

    worker.once('message', (message: unknown) => {
      settle(() => {
        if (isMessage(message) && message.ok) resolve(message.result);
        else reject(conversionError(isMessage(message) && !message.ok ? message.code : undefined));
      });
    });
    worker.once('error', () => {
      settle(() => {
        reject(new FetchError('too_complex'));
      });
    });
    worker.once('exit', () => {
      settle(() => {
        reject(new FetchError('too_complex'));
      });
    });
  });
}
