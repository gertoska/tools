import type { LookupAddress, LookupOptions } from 'node:dns';
import { lookup as dnsLookup } from 'node:dns/promises';
import { Agent, fetch } from 'undici';
import { FetchError } from './errors.ts';
import { DEFAULT_PORTS, isPublicAddress, parseTargetUrl } from './ssrf.ts';

export interface SafeFetchOptions {
  /** Total time for the whole request, redirects and body included. */
  timeoutMs?: number;
  /** Largest body accepted, counted after decompression. */
  maxBytes?: number;
  maxRedirects?: number;
  userAgent?: string;
  /** Everything below exists so tests can reach a local server. The API never sets it. */
  allowedPorts?: readonly number[];
  isAllowedAddress?: (address: string) => boolean;
  resolve?: (hostname: string) => Promise<LookupAddress[]>;
}

export interface SafeFetchResult {
  html: string;
  /** The URL after redirects. */
  finalUrl: string;
}

const DEFAULTS = {
  timeoutMs: 8_000,
  maxBytes: 2 * 1024 * 1024,
  maxRedirects: 3,
  userAgent: 'gertoska-tools/1.0',
} as const;

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const HTML_TYPES = new Set(['text/html', 'application/xhtml+xml']);

type LookupCallback = (
  error: NodeJS.ErrnoException | null,
  address: string | LookupAddress[],
  family?: number,
) => void;

const defaultResolve = (hostname: string): Promise<LookupAddress[]> =>
  dnsLookup(hostname, { all: true, verbatim: true });

/**
 * The DNS lookup the connection itself uses. The addresses checked here are
 * the addresses connected to, so there is no window between "check" and "use"
 * for a DNS-rebinding answer to slip through. One private address among the
 * answers rejects the whole name.
 */
function guardedLookup(
  resolve: (hostname: string) => Promise<LookupAddress[]>,
  isAllowedAddress: (address: string) => boolean,
) {
  return (hostname: string, options: LookupOptions, callback: LookupCallback): void => {
    resolve(hostname).then(
      (addresses) => {
        const first = addresses[0];
        if (first === undefined || addresses.some(({ address }) => !isAllowedAddress(address))) {
          callback(new FetchError('blocked'), []);
        } else if (options.all === true) {
          callback(null, addresses);
        } else {
          callback(null, first.address, first.family);
        }
      },
      (error: unknown) => {
        callback(error as NodeJS.ErrnoException, []);
      },
    );
  };
}

/** undici wraps connection errors in a TypeError; ours is somewhere down the cause chain. */
function findFetchError(error: unknown): FetchError | undefined {
  for (let current = error; current instanceof Error; current = current.cause) {
    if (current instanceof FetchError) return current;
  }
  return undefined;
}

function charsetOf(contentType: string, bytes: Uint8Array): string {
  const fromHeader = /charset\s*=\s*["']?([\w-]+)/i.exec(contentType)?.[1];
  if (fromHeader !== undefined) return fromHeader;
  // No charset in the header: look for <meta charset> in the first kilobyte.
  const head = new TextDecoder('latin1').decode(bytes.subarray(0, 1024));
  return /<meta[^>]+charset\s*=\s*["']?([\w-]+)/i.exec(head)?.[1] ?? 'utf-8';
}

function decode(bytes: Uint8Array, contentType: string): string {
  try {
    return new TextDecoder(charsetOf(contentType, bytes)).decode(bytes);
  } catch {
    return new TextDecoder('utf-8').decode(bytes);
  }
}

async function readLimited(response: Response, maxBytes: number): Promise<Uint8Array> {
  const declared = Number(response.headers.get('content-length'));
  if (declared > maxBytes) {
    await response.body?.cancel();
    throw new FetchError('too_large');
  }
  if (response.body === null) return new Uint8Array();

  // Content-Length can be missing or wrong, so count what actually arrives.
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new FetchError('too_large');
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

/**
 * Fetches a public web page without letting the request reach anything inside
 * our own network: scheme, port and credentials are checked up front, every
 * resolved address is checked at connect time, and every redirect is followed
 * by hand and checked again. Throws FetchError, never a raw network error.
 */
export async function fetchHtml(
  input: string,
  options: SafeFetchOptions = {},
): Promise<SafeFetchResult> {
  const settings = { ...DEFAULTS, ...options };
  const allowedPorts = options.allowedPorts ?? DEFAULT_PORTS;
  const isAllowedAddress = options.isAllowedAddress ?? isPublicAddress;
  const resolve = options.resolve ?? defaultResolve;

  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort(new FetchError('timeout'));
  }, settings.timeoutMs);
  const dispatcher = new Agent({
    connect: { lookup: guardedLookup(resolve, isAllowedAddress) },
  });

  try {
    let url = parseTargetUrl(input, { allowedPorts, isAllowedAddress });

    for (let redirects = 0; ; redirects++) {
      const response = await fetch(url, {
        dispatcher,
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'user-agent': settings.userAgent,
          accept: 'text/html,application/xhtml+xml;q=0.9',
        },
      });

      if (REDIRECT_STATUSES.has(response.status)) {
        await response.body?.cancel();
        const location = response.headers.get('location');
        if (location === null) throw new FetchError('upstream_error');
        if (redirects >= settings.maxRedirects) throw new FetchError('too_many_redirects');
        // Same checks as the first hop, on the new destination.
        url = parseTargetUrl(new URL(location, url).href, { allowedPorts, isAllowedAddress });
        continue;
      }

      if (!response.ok) {
        await response.body?.cancel();
        throw new FetchError('upstream_error');
      }

      const contentType = response.headers.get('content-type') ?? '';
      const mimeType = contentType.split(';')[0]?.trim().toLowerCase() ?? '';
      if (!HTML_TYPES.has(mimeType)) {
        await response.body?.cancel();
        throw new FetchError('not_html');
      }

      const bytes = await readLimited(response as unknown as Response, settings.maxBytes);
      return { html: decode(bytes, contentType), finalUrl: url.href };
    }
  } catch (error) {
    if (error instanceof FetchError) throw error;
    const known = findFetchError(error) ?? findFetchError(controller.signal.reason);
    if (known !== undefined) throw known;
    throw new FetchError('network', { cause: error });
  } finally {
    clearTimeout(timer);
    await dispatcher.close();
  }
}
