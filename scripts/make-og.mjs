// Builds public/slugify/og.png with no dependencies: a tiny bitmap font and zlib.
// Run with `node scripts/make-og.mjs` after changing the wording.
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

const GLYPHS = {
  A: '01110,10001,10001,11111,10001,10001,10001',
  B: '11110,10001,10001,11110,10001,10001,11110',
  C: '01110,10001,10000,10000,10000,10001,01110',
  D: '11110,10001,10001,10001,10001,10001,11110',
  E: '11111,10000,10000,11110,10000,10000,11111',
  F: '11111,10000,10000,11110,10000,10000,10000',
  G: '01110,10001,10000,10111,10001,10001,01111',
  H: '10001,10001,10001,11111,10001,10001,10001',
  I: '11111,00100,00100,00100,00100,00100,11111',
  J: '00111,00010,00010,00010,00010,10010,01100',
  K: '10001,10010,10100,11000,10100,10010,10001',
  L: '10000,10000,10000,10000,10000,10000,11111',
  M: '10001,11011,10101,10101,10001,10001,10001',
  N: '10001,11001,10101,10011,10001,10001,10001',
  O: '01110,10001,10001,10001,10001,10001,01110',
  P: '11110,10001,10001,11110,10000,10000,10000',
  Q: '01110,10001,10001,10001,10101,10010,01101',
  R: '11110,10001,10001,11110,10100,10010,10001',
  S: '01111,10000,10000,01110,00001,00001,11110',
  T: '11111,00100,00100,00100,00100,00100,00100',
  U: '10001,10001,10001,10001,10001,10001,01110',
  V: '10001,10001,10001,10001,10001,01010,00100',
  W: '10001,10001,10001,10101,10101,11011,10001',
  X: '10001,10001,01010,00100,01010,10001,10001',
  Y: '10001,10001,01010,00100,00100,00100,00100',
  Z: '11111,00001,00010,00100,01000,10000,11111',
  '-': '00000,00000,00000,11111,00000,00000,00000',
  '·': '00000,00000,00000,00100,00000,00000,00000',
  '.': '00000,00000,00000,00000,00000,00000,00100',
  '/': '00001,00010,00010,00100,01000,01000,10000',
  ' ': '00000,00000,00000,00000,00000,00000,00000',
};

const WIDTH = 1200;
const HEIGHT = 630;
const pixels = Buffer.alloc(WIDTH * HEIGHT * 3);

function fill([r, g, b]) {
  for (let i = 0; i < WIDTH * HEIGHT; i += 1) pixels.set([r, g, b], i * 3);
}

function dot(x, y, [r, g, b]) {
  if (x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT) return;
  pixels.set([r, g, b], (y * WIDTH + x) * 3);
}

function textWidth(text, scale) {
  return text.length * 6 * scale - scale;
}

function drawText(text, x, y, scale, color) {
  let cursor = x;
  for (const char of text.toUpperCase()) {
    const rows = (GLYPHS[char] ?? GLYPHS[' ']).split(',');
    rows.forEach((row, rowIndex) => {
      [...row].forEach((bit, columnIndex) => {
        if (bit !== '1') return;
        for (let dy = 0; dy < scale; dy += 1) {
          for (let dx = 0; dx < scale; dx += 1) {
            dot(cursor + columnIndex * scale + dx, y + rowIndex * scale + dy, color);
          }
        }
      });
    });
    cursor += 6 * scale;
  }
}

function rect(x, y, width, height, color) {
  for (let dy = 0; dy < height; dy += 1) {
    for (let dx = 0; dx < width; dx += 1) dot(x + dx, y + dy, color);
  }
}

const BACKGROUND = [0x10, 0x12, 0x16];
const WHITE = [0xff, 0xff, 0xff];
const ACCENT = [0x85, 0xa8, 0xff];

fill(BACKGROUND);
rect(0, 0, WIDTH, 10, ACCENT);

const title = 'SLUGIFY';
const titleScale = 20;
const titleX = Math.round((WIDTH - textWidth(`/${title}`, titleScale)) / 2);
drawText('/', titleX, 215, titleScale, ACCENT);
drawText(title, titleX + 6 * titleScale, 215, titleScale, WHITE);

const subtitle = 'FREE · PRIVATE · NO UPLOADS';
const subtitleScale = 6;
drawText(
  subtitle,
  Math.round((WIDTH - textWidth(subtitle, subtitleScale)) / 2),
  430,
  subtitleScale,
  ACCENT,
);

const url = 'GERTOSKA.COM/SLUGIFY';
const urlScale = 4;
drawText(
  url,
  Math.round((WIDTH - textWidth(url, urlScale)) / 2),
  520,
  urlScale,
  [0x8a, 0x90, 0x9c],
);

// Minimal PNG writer: IHDR, IDAT, IEND.
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

const header = Buffer.alloc(13);
header.writeUInt32BE(WIDTH, 0);
header.writeUInt32BE(HEIGHT, 4);
header[8] = 8; // bit depth
header[9] = 2; // truecolour
const raw = Buffer.alloc(HEIGHT * (WIDTH * 3 + 1));
for (let y = 0; y < HEIGHT; y += 1) {
  raw[y * (WIDTH * 3 + 1)] = 0; // no filter
  pixels.copy(raw, y * (WIDTH * 3 + 1) + 1, y * WIDTH * 3, (y + 1) * WIDTH * 3);
}

writeFileSync(
  new URL('../public/slugify/og.png', import.meta.url),
  Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]),
);

console.log('public/slugify/og.png written');
