import { PRICE_PER_COMPUTE_SECOND } from "@/lib/pricing";
import { formatUsd } from "./format";

type Props = {
  computeMs: number;
  // Raw pathUSD authorised to the provider so far.
  cost: bigint;
  tiles: number;
  totalTiles: number;
  running: boolean;
};

export function Meter({ computeMs, cost, tiles, totalTiles, running }: Props) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between text-xs uppercase tracking-wider text-zinc-500">
        <span>Meter</span>
        <span className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${running ? "animate-pulse bg-amber-400" : "bg-zinc-600"}`} />
          {running ? "Billing" : "Idle"}
        </span>
      </div>

      <div className="mt-4 font-mono text-4xl tabular-nums text-amber-300">
        {formatUsd(cost)}
        <span className="ml-2 text-sm text-zinc-500">pathUSD</span>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-4 font-mono text-sm tabular-nums">
        <div>
          <dt className="font-sans text-xs text-zinc-500">Compute time</dt>
          <dd className="mt-1 text-zinc-100">{(computeMs / 1000).toFixed(2)} s</dd>
        </div>
        <div>
          <dt className="font-sans text-xs text-zinc-500">Tiles rendered</dt>
          <dd className="mt-1 text-zinc-100">
            {tiles} / {totalTiles}
          </dd>
        </div>
      </dl>

      <p className="mt-5 border-t border-white/10 pt-4 text-xs text-zinc-500">
        {PRICE_PER_COMPUTE_SECOND} pathUSD per second of compute. The first second is paid when the stream opens.
      </p>
    </section>
  );
}
