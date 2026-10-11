import { PRICE_PER_COMPUTE_SECOND } from "@/lib/pricing";
import { formatUsd } from "./format";

type Props = {
  computeMs: number;
  // Raw pathUSD authorised to the provider so far.
  cost: bigint;
  // Raw pathUSD locked when the channel opened.
  deposit: bigint;
  tiles: number;
  totalTiles: number;
  // Short status shown next to the indicator dot, e.g. "Billing".
  label: string;
  running: boolean;
  settled: boolean;
};

export function Meter({ computeMs, cost, deposit, tiles, totalTiles, label, running, settled }: Props) {
  const spentShare = Math.min(100, (Number(cost) / Number(deposit)) * 100);
  const rest = cost < deposit ? deposit - cost : BigInt(0);
  const restFill = settled ? "bg-emerald-400/70" : running ? "bg-emerald-400/25" : "";
  const restLabel = settled ? "Refunded " : running ? "Refundable " : "Deposit ";
  const dot = running ? "animate-pulse bg-amber-400" : settled ? "bg-emerald-400" : "bg-zinc-600";

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between text-xs uppercase tracking-wider text-zinc-500">
        <span>Meter</span>
        <span className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${dot}`} />
          {label}
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

      {/* The deposit, split into what the work has cost and what goes back to the buyer. */}
      <div className="mt-5">
        <div className="flex h-2 overflow-hidden rounded-full bg-white/[0.06]">
          <div className="bg-amber-400 transition-[width] duration-200" style={{ width: `${spentShare}%` }} />
          <div className={`flex-1 transition-colors duration-500 ${restFill}`} />
        </div>
        <div className="mt-2 flex justify-between font-mono text-xs tabular-nums">
          <span className="text-amber-300">
            <span className="font-sans text-zinc-500">Spent </span>
            {formatUsd(cost)}
          </span>
          <span className={settled || running ? "text-emerald-300" : "text-zinc-400"}>
            <span className="font-sans text-zinc-500">{restLabel}</span>
            {formatUsd(rest)}
          </span>
        </div>
      </div>

      <p className="mt-5 border-t border-white/10 pt-4 text-xs text-zinc-500">
        {PRICE_PER_COMPUTE_SECOND} pathUSD per second of compute. The first second is paid when the stream opens.
      </p>
    </section>
  );
}
