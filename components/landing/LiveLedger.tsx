"use client";

import { useEffect, useState } from "react";

type Ledger = {
  sessions: number;
  paid: string;
  refunded: string;
  recent: { paid: string; refunded: string; txHash: string; txUrl: string; at: number }[];
};

const REFRESH_MS = 15_000;

// What this page's provider has settled on Tempo so far. Every figure is read from the chain, and
// each recent session links to its transaction.
export function LiveLedger() {
  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/ledger");
        if (response.ok && !cancelled) {
          setLedger(await response.json());
          setNow(Date.now());
        }
      } catch {
        // The figures are informational; the next poll will retry.
      }
    }
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const facts = [
    { value: ledger ? String(ledger.sessions) : "—", unit: "sessions", label: "settled on Tempo by this page's provider" },
    { value: ledger ? trim(ledger.paid) : "—", unit: "pathUSD", label: "paid for work delivered" },
    { value: ledger ? trim(ledger.refunded) : "—", unit: "pathUSD", label: "returned to buyers, unused" },
    { value: ledger?.recent[0] ? ago(now - ledger.recent[0].at) : "—", unit: "", label: "since the latest settlement" },
  ];

  return (
    <section className="border-y border-white/10 bg-white/[0.015]">
      <div className="mx-auto max-w-6xl px-6">
        <p className="flex items-center gap-2 pt-6 font-mono text-xs uppercase tracking-[0.18em] text-zinc-500">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          Live from the chain
        </p>
        <dl className="grid grid-cols-2 gap-px lg:grid-cols-4">
          {facts.map((fact) => (
            <div key={fact.label} className="py-6 pr-6">
              <dd className="font-mono text-3xl tabular-nums text-zinc-50">
                {fact.value} <span className="text-sm text-zinc-500">{fact.unit}</span>
              </dd>
              <dt className="mt-2 text-sm text-zinc-500">{fact.label}</dt>
            </div>
          ))}
        </dl>

        {ledger && ledger.recent.length > 0 && (
          <ul className="grid gap-x-8 border-t border-white/10 py-4 font-mono text-xs tabular-nums text-zinc-500 sm:grid-cols-2 lg:grid-cols-4">
            {ledger.recent.map((item) => (
              <li key={item.txHash} className="whitespace-nowrap py-1">
                <a
                  href={item.txUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`Settlement ${item.txHash} on the Tempo explorer`}
                  className="group flex items-baseline justify-between gap-3"
                >
                  <span>
                    <span className="text-amber-300">{brief(item.paid)}</span> paid ·{" "}
                    <span className="text-emerald-300">{brief(item.refunded)}</span> back
                  </span>
                  <span className="transition-colors group-hover:text-zinc-200">tx ↗</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

// Totals to two decimals: the exact amounts are in the rows below and on the explorer.
function trim(raw: string): string {
  return (Number(raw) / 1_000_000).toFixed(2);
}

// Four decimals is enough to tell sessions apart at a glance; the link has the exact amount.
function brief(raw: string): string {
  return (Number(raw) / 1_000_000).toFixed(4);
}

function ago(ms: number): string {
  const minutes = Math.max(0, Math.round(ms / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  return hours < 48 ? `${hours} h` : `${Math.round(hours / 24)} d`;
}
