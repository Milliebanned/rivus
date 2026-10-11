import { formatBalance, formatDelta, shortAddress } from "./format";

export type Party = { address: string; balance: string };

type Props = {
  title: string;
  party: Party | null;
  explorer: string | null;
  // The line that changes during a render: vouchers received (provider) or deposit locked (buyer).
  liveLabel: string;
  liveValue: string;
  // Raw on-chain balance before the current run opened its channel; null until a run has started.
  baseline: string | null;
};

// One side of the payment, as two rows. Used for both the provider and the buyer so the two read as a pair.
export function ProviderPanel({ title, party, explorer, liveLabel, liveValue, baseline }: Props) {
  const change = party && baseline ? BigInt(party.balance) - BigInt(baseline) : null;
  const changeColor =
    change === null || change === BigInt(0) ? "text-zinc-100" : change > BigInt(0) ? "text-emerald-300" : "text-amber-300";

  return (
    <div className="space-y-1.5 whitespace-nowrap py-3 font-mono text-xs tabular-nums">
      <div className="flex items-baseline justify-between gap-3">
        <span className="flex items-baseline gap-2.5">
          <span className="font-sans uppercase tracking-wider text-zinc-500">{title}</span>
          {party && explorer && (
            <a
              href={`${explorer}/address/${party.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-400 underline decoration-white/20 underline-offset-2 hover:text-zinc-200"
            >
              {shortAddress(party.address)}
            </a>
          )}
        </span>
        <span className="text-zinc-100" title="On-chain pathUSD balance">
          <span className="font-sans text-zinc-500">Balance </span>
          {party ? formatBalance(party.balance) : "—"}
        </span>
      </div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-zinc-100">
          <span className="font-sans text-zinc-500">{liveLabel} </span>
          {liveValue}
        </span>
        <span className={changeColor} title="Change in on-chain balance this run, after network fees">
          {change === null ? "—" : formatDelta(change)}
          <span className="font-sans text-zinc-500"> this run</span>
        </span>
      </div>
    </div>
  );
}
