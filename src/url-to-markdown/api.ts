import type { FetchErrorCode } from '../../api/_lib/errors';
import { isRecord } from '../shared/storage';

export type ConvertMode = 'main' | 'full';

export interface Conversion {
  markdown: string;
  title: string;
  finalUrl: string;
  usedFallback: boolean;
}

/** `rate_limited` comes from the firewall in front of the function, not from the function. */
export type ConversionErrorCode = FetchErrorCode | 'rate_limited' | 'unknown';

const ERROR_CODES: readonly ConversionErrorCode[] = [
  'invalid_url',
  'blocked',
  'too_many_redirects',
  'timeout',
  'too_large',
  'not_html',
  'empty_content',
  'too_complex',
  'upstream_error',
  'network',
];

export class ConversionError extends Error {
  readonly code: ConversionErrorCode;

  constructor(code: ConversionErrorCode) {
    super(code);
    this.name = 'ConversionError';
    this.code = code;
  }
}

/** The server never answers with more than a code, but the answer is still checked. */
function parseConversion(body: unknown): Conversion | null {
  if (!isRecord(body)) return null;
  const { markdown, title, finalUrl, usedFallback } = body;
  if (
    typeof markdown !== 'string' ||
    typeof title !== 'string' ||
    typeof finalUrl !== 'string' ||
    typeof usedFallback !== 'boolean'
  ) {
    return null;
  }
  return { markdown, title, finalUrl, usedFallback };
}

function parseErrorCode(body: unknown): ConversionErrorCode {
  if (!isRecord(body)) return 'unknown';
  const code = body['error'];
  return ERROR_CODES.find((known) => known === code) ?? 'unknown';
}

/** The only network request in the whole tool. Same origin, nothing stored. */
export async function convertUrl(
  address: string,
  mode: ConvertMode,
  signal?: AbortSignal,
): Promise<Conversion> {
  let response: Response;
  try {
    // The address goes in the body: request logs keep URLs, not bodies.
    response = await fetch('/api/url-to-markdown', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ url: address, mode }),
      signal,
      cache: 'no-store',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ConversionError('unknown');
  }

  if (response.status === 429) throw new ConversionError('rate_limited');

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ConversionError('unknown');
  }

  if (!response.ok) throw new ConversionError(parseErrorCode(body));
  const conversion = parseConversion(body);
  if (conversion === null) throw new ConversionError('unknown');
  return conversion;
}
