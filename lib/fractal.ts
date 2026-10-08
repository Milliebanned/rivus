export type RenderSpec = {
  width: number;
  height: number;
  tileSize: number;
  // Centre of the view on the complex plane, and the width of the view in plane units.
  centerX: number;
  centerY: number;
  scale: number;
  maxIter: number;
  // Supersampling grid per pixel edge (2 = 4 samples per pixel).
  samples: number;
};

export type TileRect = { x: number; y: number; width: number; height: number };

export type Tile = TileRect & {
  index: number;
  total: number;
  // RGBA, row-major, width * height * 4 bytes.
  pixels: Uint8ClampedArray;
  // CPU time spent computing this tile, excluding time parked between tiles.
  computeMs: number;
};

// Seahorse valley: boundary-dense, so iteration cost is spread across the frame instead of
// concentrated in a few all-interior tiles.
export const DEFAULT_SPEC: RenderSpec = {
  width: 1080,
  height: 720,
  tileSize: 60,
  centerX: -0.7453,
  centerY: 0.1127,
  scale: 0.0065,
  maxIter: 1000,
  samples: 7,
};

const BAILOUT = 256 * 256;
const LOG2 = Math.log(2);
const TAU = Math.PI * 2;

// Tiles ordered centre-out, so the image grows from the middle rather than scanning top to bottom.
export function tileOrder(spec: RenderSpec): TileRect[] {
  const tiles: TileRect[] = [];
  for (let y = 0; y < spec.height; y += spec.tileSize) {
    for (let x = 0; x < spec.width; x += spec.tileSize) {
      tiles.push({
        x,
        y,
        width: Math.min(spec.tileSize, spec.width - x),
        height: Math.min(spec.tileSize, spec.height - y),
      });
    }
  }
  const cx = spec.width / 2;
  const cy = spec.height / 2;
  const distance = (t: TileRect) => Math.hypot(t.x + t.width / 2 - cx, t.y + t.height / 2 - cy);
  return tiles.sort((a, b) => distance(a) - distance(b));
}

export function renderTile(spec: RenderSpec, rect: TileRect): Uint8ClampedArray {
  const { width, height, centerX, centerY, scale, maxIter, samples } = spec;
  const step = scale / width;
  const originX = centerX - scale / 2;
  const originY = centerY + (step * height) / 2;
  const sampleCount = samples * samples;
  const pixels = new Uint8ClampedArray(rect.width * rect.height * 4);

  let offset = 0;
  for (let py = rect.y; py < rect.y + rect.height; py++) {
    for (let px = rect.x; px < rect.x + rect.width; px++) {
      let r = 0;
      let g = 0;
      let b = 0;

      for (let sy = 0; sy < samples; sy++) {
        const ci = originY - (py + (sy + 0.5) / samples) * step;
        for (let sx = 0; sx < samples; sx++) {
          const cr = originX + (px + (sx + 0.5) / samples) * step;

          let zr = 0;
          let zi = 0;
          let zr2 = 0;
          let zi2 = 0;
          let iter = 0;
          while (iter < maxIter && zr2 + zi2 <= BAILOUT) {
            zi = 2 * zr * zi + ci;
            zr = zr2 - zi2 + cr;
            zr2 = zr * zr;
            zi2 = zi * zi;
            iter++;
          }

          // Points that never escape are in the set and stay black.
          if (iter < maxIter) {
            // Fractional escape count, so colour bands blend instead of stepping.
            const smooth = iter + 1 - Math.log(Math.log(zr2 + zi2) / 2 / LOG2) / LOG2;
            const t = Math.sqrt(smooth) * 0.11;
            r += 0.5 + 0.5 * Math.cos(TAU * (t + 0.6));
            g += 0.5 + 0.5 * Math.cos(TAU * (t + 0.5));
            b += 0.5 + 0.5 * Math.cos(TAU * (t + 0.33));
          }
        }
      }

      pixels[offset++] = (r / sampleCount) * 255;
      pixels[offset++] = (g / sampleCount) * 255;
      pixels[offset++] = (b / sampleCount) * 255;
      pixels[offset++] = 255;
    }
  }
  return pixels;
}

// Yields finished tiles one at a time. The work is synchronous per tile, so the generator parks
// on the event loop between tiles to let other requests (voucher top-ups, close) through.
export async function* renderTiles(spec: RenderSpec = DEFAULT_SPEC, signal?: AbortSignal): AsyncGenerator<Tile> {
  const order = tileOrder(spec);
  for (let index = 0; index < order.length; index++) {
    if (signal?.aborted) return;
    const rect = order[index];
    const startedAt = performance.now();
    const pixels = renderTile(spec, rect);
    const computeMs = performance.now() - startedAt;
    yield { ...rect, index, total: order.length, pixels, computeMs };
    await new Promise((resolve) => setImmediate(resolve));
  }
}
