import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { DEFAULT_SPEC, renderTiles } from "../lib/fractal";

// Renders the default spec with no payment logic, prints timing, and optionally writes a PNG:
//   npm run bench -- out.png
const outPath = process.argv[2];
const spec = DEFAULT_SPEC;
const image = new Uint8Array(spec.width * spec.height * 4);
const times: number[] = [];

// Tracks how long the event loop is held, since voucher requests have to fit between tiles.
const startedAt = performance.now();
for await (const tile of renderTiles(spec)) {
  times.push(tile.computeMs);
  for (let row = 0; row < tile.height; row++) {
    const from = row * tile.width * 4;
    image.set(tile.pixels.subarray(from, from + tile.width * 4), ((tile.y + row) * spec.width + tile.x) * 4);
  }
}
const wallMs = performance.now() - startedAt;

const sorted = [...times].sort((a, b) => a - b);
const computeMs = times.reduce((sum, ms) => sum + ms, 0);
const ms = (value: number) => `${value.toFixed(0)}ms`;

console.log(`${spec.width}x${spec.height}, ${times.length} tiles of ${spec.tileSize}px, maxIter ${spec.maxIter}, ${spec.samples}x${spec.samples} samples`);
console.log(`total: ${(wallMs / 1000).toFixed(1)}s wall, ${(computeMs / 1000).toFixed(1)}s compute`);
console.log(`per tile: min ${ms(sorted[0])}, median ${ms(sorted[sorted.length >> 1])}, max ${ms(sorted[sorted.length - 1])}`);

if (outPath) {
  writeFileSync(outPath, encodePng(image, spec.width, spec.height));
  console.log(`wrote ${outPath}`);
}

function encodePng(rgba: Uint8Array, width: number, height: number): Buffer {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw.set(rgba.subarray(y * stride, (y + 1) * stride), y * (stride + 1) + 1);
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 6, 0, 0, 0], 8);

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function chunk(type: string, data: Buffer): Buffer {
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const out = Buffer.alloc(body.length + 8);
  out.writeUInt32BE(data.length, 0);
  body.copy(out, 4);
  out.writeUInt32BE(crc32(body), body.length + 4);
  return out;
}

function crc32(bytes: Buffer): number {
  let crc = ~0;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return ~crc >>> 0;
}
