/**
 * Checks, from outside, that the Vercel Firewall rate-limit rule is really
 * blocking and not just logging:  node scripts/check-rate-limit.mjs https://gertoska.com
 *
 * It sends requests for an address our own code refuses (the cloud metadata IP),
 * so each one is cheap and nothing is fetched from anywhere. Run it against a
 * deployment you own, and wait a minute before running it again.
 */
const base = process.argv[2];
const total = Number(process.argv[3] ?? 16);
const limit = 10;

if (base === undefined) {
  console.error('Usage: node scripts/check-rate-limit.mjs <https://deployment> [requests]');
  process.exit(2);
}

const target = new URL('/api/url-to-markdown', base);
const seen = [];

for (let n = 1; n <= total; n++) {
  const response = await fetch(target, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ url: 'http://169.254.169.254/' }),
  });
  const text = await response.text();
  // Our function answers {"error":"blocked"}; anything else came from in front of it.
  const ours = response.status === 403 && text.includes('"blocked"');
  seen.push({ n, status: response.status, ours });
  console.log(
    `${String(n).padStart(2)}  ${response.status}  ${ours ? 'function' : 'firewall / platform'}`,
  );
}

const first = seen.find((entry) => !entry.ours);
if (seen.some((entry) => entry.status === 401)) {
  console.log('\n401: the deployment is behind Vercel Authentication. Test the production domain.');
  process.exit(2);
}
if (first === undefined) {
  console.log(
    `\nNOT LIMITED: ${total} requests all reached the function. The rule is missing, only set to Log, or counts something else.`,
  );
  process.exit(1);
}
console.log(
  `\nLimited from request ${first.n} (status ${first.status}). Expected after about ${limit}.`,
);
