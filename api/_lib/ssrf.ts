import { BlockList, isIP } from 'node:net';
import { FetchError } from './errors.ts';

/** Only the ports a website normally answers on. */
export const DEFAULT_PORTS: readonly number[] = [80, 443];

const MAX_URL_LENGTH = 2048;

/**
 * IPv4 ranges that are not the public internet: private networks, loopback,
 * link-local (cloud metadata lives at 169.254.169.254), carrier-grade NAT,
 * documentation, benchmarking, multicast and reserved space.
 */
const IPV4_BLOCKED: readonly (readonly [string, number])[] = [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.88.99.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
];

/**
 * IPv6 is an allow-list: only global unicast (2000::/3) is public. That alone
 * rejects ::1, fe80::/10, fc00::/7 (which covers fd00:ec2::254, the AWS
 * metadata address), multicast, IPv4-mapped (::ffff:a.b.c.d) in either
 * spelling, and NAT64 (64:ff9b::/96). Inside 2000::/3, these are carved out.
 */
const IPV6_BLOCKED: readonly (readonly [string, number])[] = [
  ['2001::', 23], // Teredo and IETF protocol assignments
  ['2001:db8::', 32], // documentation
  ['2002::', 16], // 6to4, which embeds an IPv4 address
  ['3fff::', 20], // documentation
];

const ipv4Blocked = new BlockList();
for (const [network, prefix] of IPV4_BLOCKED) ipv4Blocked.addSubnet(network, prefix, 'ipv4');

const ipv6Public = new BlockList();
ipv6Public.addSubnet('2000::', 3, 'ipv6');

const ipv6Blocked = new BlockList();
for (const [network, prefix] of IPV6_BLOCKED) ipv6Blocked.addSubnet(network, prefix, 'ipv6');

/** True only for an IP literal that sits on the public internet. */
export function isPublicAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) return !ipv4Blocked.check(address, 'ipv4');
  if (family === 6) {
    return ipv6Public.check(address, 'ipv6') && !ipv6Blocked.check(address, 'ipv6');
  }
  return false;
}

/**
 * Turns what the visitor typed into a URL the server may fetch, or throws.
 * Hosts that are names are checked later, when they are resolved (see
 * safe-fetch.ts); IP literals never get resolved, so they are checked here.
 *
 * The WHATWG parser already turns 2130706433, 0x7f000001, 0177.0.0.1 and 127.1
 * into 127.0.0.1, so those spellings cannot get around the range check.
 */
export function parseTargetUrl(
  input: string,
  options: {
    allowedPorts?: readonly number[];
    isAllowedAddress?: (address: string) => boolean;
  } = {},
): URL {
  const { allowedPorts = DEFAULT_PORTS, isAllowedAddress = isPublicAddress } = options;

  const text = input.trim();
  if (text === '' || text.length > MAX_URL_LENGTH) throw new FetchError('invalid_url');

  // "example.com/post" is what people paste; only add a scheme when none is there.
  const withScheme = text.includes('://') ? text : `https://${text}`;

  let url: URL;
  try {
    url = new URL(withScheme);
  } catch (cause) {
    throw new FetchError('invalid_url', { cause });
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new FetchError('invalid_url');
  if (url.username !== '' || url.password !== '') throw new FetchError('invalid_url');
  if (url.hostname === '') throw new FetchError('invalid_url');

  // An empty port means the scheme's default, 80 or 443.
  const port = url.port === '' ? (url.protocol === 'https:' ? 443 : 80) : Number(url.port);
  if (!allowedPorts.includes(port)) throw new FetchError('blocked');

  // IPv6 literals come back as "[::1]".
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (isIP(host) !== 0 && !isAllowedAddress(host)) throw new FetchError('blocked');

  return url;
}
