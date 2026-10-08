import { renderTiles } from "@/lib/fractal";
import { getProvider } from "@/lib/provider";
import { DEPOSIT, PRICE_PER_COMPUTE_SECOND } from "@/lib/pricing";
import { PATH_USD_DECIMALS } from "@/lib/tempo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RAW_PER_COMPUTE_SECOND = BigInt(Math.round(Number(PRICE_PER_COMPUTE_SECOND) * 10 ** PATH_USD_DECIMALS));
const RAW_PER_COMPUTE_MS = Number(RAW_PER_COMPUTE_SECOND) / 1000;

async function handle(request: Request): Promise<Response> {
  const { mppx } = getProvider();

  const result = await mppx.session({
    amount: PRICE_PER_COMPUTE_SECOND,
    suggestedDeposit: DEPOSIT,
    unitType: "compute-second",
  })(request);

  if (result.status === 402) return result.challenge;
  if (request.method !== "GET") return result.withReceipt(new Response(null, { status: 204 }));

  return result.withReceipt(async function* (stream) {
    // Opening the stream pays for the first compute-second; tiles draw that down before anything more is charged.
    await stream.charge();
    let credit = RAW_PER_COMPUTE_SECOND;

    for await (const tile of renderTiles(undefined, stream.signal)) {
      // Each tile is billed for the CPU time it actually took, pro rata against the per-second price.
      const cost = BigInt(Math.round(tile.computeMs * RAW_PER_COMPUTE_MS));
      const due = cost > credit ? cost - credit : BigInt(0);
      credit -= cost - due;
      if (due > BigInt(0)) await stream.charge(due);
      yield JSON.stringify({
        ...tile,
        pixels: Buffer.from(tile.pixels.buffer).toString("base64"),
        cost: cost.toString(),
      });
    }
  });
}

export const GET = handle;
export const POST = handle;
