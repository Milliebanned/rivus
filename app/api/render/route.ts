import { createMeter } from "rivus-meter/server";
import { renderTiles } from "@/lib/fractal";
import { DEPOSIT, PRICE_PER_COMPUTE_SECOND } from "@/lib/pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const meter = createMeter({
  privateKey: process.env.PROVIDER_PRIVATE_KEY,
  secret: process.env.RIVUS_SECRET,
  price: PRICE_PER_COMPUTE_SECOND,
  deposit: DEPOSIT,
  unit: "compute-second",
});

// The work being sold: a fractal, tile by tile. Each tile is billed for the CPU time the renderer
// measured for it, so time parked on the event loop between tiles is never charged.
export const { GET, POST } = meter.route(async function* (job) {
  for await (const tile of renderTiles(undefined, job.signal)) {
    yield job.unit(
      { ...tile, pixels: Buffer.from(tile.pixels.buffer).toString("base64") },
      { seconds: tile.computeMs / 1000 },
    );
  }
});
