type Props = {
  stopped: boolean;
  paid: string;
  refunded: string;
  computeSeconds: string;
  txUrl: string | null;
};

// The outcome of a run: what was paid, what came back, and where to check it.
// Kept to one row so it stays on screen under the canvas.
export function Receipt({ stopped, paid, refunded, computeSeconds, txUrl }: Props) {
  return (
    <section className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 rounded-lg border border-emerald-400/30 bg-emerald-400/[0.06] px-4 py-3.5">
      <div>
        <h2 className="text-sm font-medium text-zinc-50">{stopped ? "Stopped early" : "Render complete"}</h2>
        <p className="mt-0.5 text-xs text-emerald-300">Settled on-chain</p>
      </div>

      <dl className="flex gap-7 font-mono tabular-nums">
        <div>
          <dt className="font-sans text-xs text-zinc-400">Paid</dt>
          <dd className="mt-0.5 text-lg text-amber-300">{paid}</dd>
        </div>
        <div>
          <dt className="font-sans text-xs text-zinc-400">Refunded</dt>
          <dd className="mt-0.5 text-lg text-emerald-300">{refunded}</dd>
        </div>
        <div>
          <dt className="font-sans text-xs text-zinc-400">Compute billed</dt>
          <dd className="mt-0.5 text-lg text-zinc-100">{computeSeconds} s</dd>
        </div>
      </dl>

      {txUrl && (
        <a
          href={txUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-emerald-300/40 px-3 py-2 text-sm text-emerald-200 transition-colors hover:border-emerald-300/70 hover:bg-emerald-300/10"
        >
          View on Tempo explorer →
        </a>
      )}
    </section>
  );
}
