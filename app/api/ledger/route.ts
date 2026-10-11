import { addressOf, txUrl } from "rivus-meter";
import { blockTime, settlementsOf } from "@/lib/ledger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RECENT = 4;

// What the demo provider has settled so far, read from Tempo: totals and the latest few sessions.
export async function GET(): Promise<Response> {
  const provider = addressOf(process.env.PROVIDER_PRIVATE_KEY, "PROVIDER_PRIVATE_KEY");
  const settlements = await settlementsOf(provider);

  const sum = (key: "paid" | "refunded") => settlements.reduce((total, item) => total + BigInt(item[key]), BigInt(0)).toString();
  const recent = await Promise.all(
    settlements.slice(0, RECENT).map(async (item) => ({
      paid: item.paid,
      refunded: item.refunded,
      txHash: item.txHash,
      txUrl: txUrl(item.txHash),
      at: await blockTime(item.block),
    })),
  );

  return Response.json({ sessions: settlements.length, paid: sum("paid"), refunded: sum("refunded"), recent });
}
