import { formatUsd, shortAddress } from "./format";

export type Party = { address: string; balance: string };

type Props = {
  title: string;
  party: Party | null;
  explorer: string | null;
  // The line that changes during a render: vouchers received (provider) or deposit locked (buyer).
  liveLabel: string;
  liveValue: string;
  note: string;
};

// One side of the payment. Used for both the provider and the buyer so the two read as a pair.
export function ProviderPanel({ title, party, explorer, liveLabel, liveValue, note }: Props) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between text-xs">
        <span className="uppercase tracking-wider text-zinc-500">{title}</span>
        {party && explorer && (
          <a
            href={`${explorer}/address/${party.address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-zinc-400 underline decoration-white/20 underline-offset-2 hover:text-zinc-200"
          >
            {shortAddress(party.address)}
          </a>
        )}
      </div>

      <dl className="mt-3 space-y-2 font-mono text-sm tabular-nums">
        <div className="flex justify-between gap-4">
          <dt className="font-sans text-zinc-500">{liveLabel}</dt>
          <dd className="text-zinc-100">{liveValue}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="font-sans text-zinc-500">On-chain balance</dt>
          <dd className="text-zinc-100">{party ? formatUsd(party.balance) : "—"}</dd>
        </div>
      </dl>

      <p className="mt-3 text-xs text-zinc-500">{note}</p>
    </section>
  );
}
