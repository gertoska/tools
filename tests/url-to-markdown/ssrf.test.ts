import { describe, expect, it } from 'vitest';
import { FetchError } from '../../api/_lib/errors.ts';
import { isPublicAddress, parseTargetUrl } from '../../api/_lib/ssrf.ts';

function codeOf(input: string): string | undefined {
  try {
    parseTargetUrl(input);
  } catch (error) {
    return error instanceof FetchError ? error.code : 'unexpected';
  }
  return undefined;
}

describe('isPublicAddress', () => {
  it.each([
    '0.0.0.0',
    '10.0.0.1',
    '100.64.0.1',
    '127.0.0.1',
    '127.255.255.254',
    '169.254.169.254',
    '172.16.0.1',
    '172.31.255.255',
    '192.168.1.1',
    '198.18.0.1',
    '224.0.0.1',
    '255.255.255.255',
    '::',
    '::1',
    'fe80::1',
    'fc00::1',
    'fd00:ec2::254',
    'ff02::1',
    '::ffff:127.0.0.1',
    '::ffff:7f00:1',
    '::ffff:10.0.0.1',
    '64:ff9b::7f00:1',
    '2002:7f00:1::1',
    '2001:db8::1',
    'not an address',
    '',
  ])('rejects %s', (address) => {
    expect(isPublicAddress(address)).toBe(false);
  });

  it.each([
    '8.8.8.8',
    '1.1.1.1',
    '172.15.255.255',
    '172.32.0.1',
    '2606:4700:4700::1111',
    '2a00:1450:4001:81b::200e',
  ])('accepts %s', (address) => {
    expect(isPublicAddress(address)).toBe(true);
  });
});

describe('parseTargetUrl', () => {
  it('accepts an ordinary page and keeps its path and query', () => {
    expect(parseTargetUrl('https://example.com/blog/post?a=1').href).toBe(
      'https://example.com/blog/post?a=1',
    );
  });

  it('adds https when the scheme is missing', () => {
    expect(parseTargetUrl('example.com/blog').href).toBe('https://example.com/blog');
  });

  it('accepts the standard ports, written or implied', () => {
    expect(codeOf('http://example.com')).toBeUndefined();
    expect(codeOf('http://example.com:80/')).toBeUndefined();
    expect(codeOf('https://example.com:443/')).toBeUndefined();
  });

  it.each([
    'http://127.0.0.1/',
    'http://169.254.169.254/latest/meta-data/',
    'http://10.0.0.1/',
    'http://172.16.0.1/',
    'http://192.168.1.1/',
    'http://0.0.0.0/',
    'http://[::1]/',
    'http://[fe80::1]/',
    'http://[fd00:ec2::254]/',
    'http://[::ffff:127.0.0.1]/',
    'http://[::ffff:7f00:1]/',
  ])('blocks the internal address %s', (input) => {
    expect(codeOf(input)).toBe('blocked');
  });

  it.each([
    ['decimal', 'http://2130706433/'],
    ['hex', 'http://0x7f000001/'],
    ['octal', 'http://0177.0.0.1/'],
    ['short', 'http://127.1/'],
    ['mixed', 'http://0x7f.0.0.1/'],
    ['metadata in decimal', 'http://2852039166/'],
  ])('blocks loopback and metadata written in %s', (_name, input) => {
    expect(codeOf(input)).toBe('blocked');
  });

  it.each(['http://example.com:8080/', 'https://example.com:22/', 'http://example.com:0/'])(
    'blocks the port in %s',
    (input) => {
      expect(codeOf(input)).toBe('blocked');
    },
  );

  it.each(['ftp://example.com/', 'file:///etc/passwd', 'javascript:alert(1)', 'data:text/html,hi'])(
    'rejects the scheme in %s',
    (input) => {
      expect(codeOf(input)).toBe('invalid_url');
    },
  );

  it.each([
    'http://user:pass@example.com/',
    'https://user@example.com/',
    'https://:pw@example.com/',
  ])('rejects credentials in %s', (input) => {
    expect(codeOf(input)).toBe('invalid_url');
  });

  it.each([
    '',
    '   ',
    'http://',
    'http://exa mple.com/',
    `https://example.com/${'a'.repeat(3000)}`,
  ])('rejects the malformed input %#', (input) => {
    expect(codeOf(input)).toBe('invalid_url');
  });

  it('does not let an IP literal sneak past through the userinfo trick', () => {
    // The host here is 127.0.0.1; "example.com" is only the username.
    expect(codeOf('http://example.com@127.0.0.1/')).toBe('invalid_url');
  });
});
