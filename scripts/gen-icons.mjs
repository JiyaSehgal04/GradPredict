/**
 * Generates simple solid-colour PNG icons for the PWA manifest.
 * Uses pure Node.js — no native dependencies needed.
 * Run: node scripts/gen-icons.mjs
 */
import { writeFileSync, mkdirSync } from 'fs';
import { deflateSync } from 'zlib';

function uint32BE(n) {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n, 0);
  return b;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) {
    c ^= byte;
    for (let i = 0; i < 8; i++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const len = uint32BE(data.length);
  const crc = uint32BE(crc32(Buffer.concat([typeBytes, data])));
  return Buffer.concat([len, typeBytes, data, crc]);
}

function makePNG(size, r, g, b) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // colour type: RGB
  // compression, filter, interlace = 0

  // Raw image data: one filter byte (0) + RGB per pixel, per row
  const rowBytes = 1 + size * 3;
  const raw = Buffer.alloc(size * rowBytes);
  for (let y = 0; y < size; y++) {
    const base = y * rowBytes;
    raw[base] = 0; // filter type None
    for (let x = 0; x < size; x++) {
      const off = base + 1 + x * 3;
      raw[off]     = r;
      raw[off + 1] = g;
      raw[off + 2] = b;
    }
  }

  const compressed = deflateSync(raw);

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync('public/icons', { recursive: true });

// Indigo #4f46e5  → r=79, g=70, b=229
writeFileSync('public/icons/icon-192.png', makePNG(192, 79, 70, 229));
writeFileSync('public/icons/icon-512.png', makePNG(512, 79, 70, 229));

console.log('Icons written to public/icons/');
