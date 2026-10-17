"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_SPEC, tileOrder } from "@/lib/fractal";
import { DEPOSIT, PRICE_PER_COMPUTE_SECOND } from "@/lib/pricing";
import { Canvas, type CanvasHandle } from "./Canvas";
import { DevSnippet } from "./DevSnippet";
import { Lifecycle, type Stage } from "./Lifecycle";
import { Logo } from "./Logo";
import { Meter } from "./Meter";
import { ProviderPanel, type Party } from "./ProviderPanel";
import { Receipt } from "./Receipt";
import { Terminal, type LogLine } from "./Terminal";
import { formatUsd } from "./format";

type Balances = { explorer: string; agent: Party; provider: Party };
type Settlement = { settled: string; deposit: string; txUrl: string | null; stopped: boolean };

const TOTAL_TILES = tileOrder(DEFAULT_SPEC).length;
const ZERO = BigInt(0);
const RAW_PER_COMPUTE_MS = Number(PRICE_PER_COMPUTE_SECOND) * 1_000;
const RAW_DEPOSIT = BigInt(Math.round(Number(DEPOSIT) * 1_000_000));
const METER_LABELS: Record<Stage, string> = {
  idle: "Idle",
  opening: "Opening",
  rendering: "Billing",
  settling: "Settling",
  settled: "Settled",
  failed: "Stopped",
};

// `embedded` drops the page header and the developer panel, for use as a section of the landing page.
export function Dashboard({ embedded = false }: { embedded?: boolean }) {
  const canvas = useRef<CanvasHandle>(null);
  const source = useRef<EventSource | null>(null);
  const runId = useRef<string | null>(null);
  // Set once a run has reported its outcome, so the stream ending afterwards isn't treated as a failure.
  const finished = useRef(false);

  const [status, setStatus] = useState<Stage>("idle");
  const [computeMs, setComputeMs] = useState(0);
  const [cost, setCost] = useState(ZERO);
  const [tiles, setTiles] = useState(0);
  const [settlement, setSettlement] = useState<Settlement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [balances, setBalances] = useState<Balances | null>(null);
  // Both balances as they stood before the current run opened its channel.
  const [baseline, setBaseline] = useState<{ agent: string; provider: string } | null>(null);
  const [log, setLog] = useState<LogLine[]>([]);

  const active = status === "opening" || status === "rendering" || status === "settling";

  const refreshBalances = useCallback(async () => {
    try {
      const response = await fetch("/api/balances");
      if (response.ok) setBalances(await response.json());
    } catch {
      // Balances are informational; the next poll will retry.
    }
  }, []);

  // Poll faster during a render, when the balances are actually moving.
  useEffect(() => {
    const first = setTimeout(refreshBalances, 0);
    const timer = setInterval(refreshBalances, active ? 2_000 : 15_000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [active, refreshBalances]);

  useEffect(() => () => source.current?.close(), []);

  function start() {
    canvas.current?.clear();
    finished.current = false;
    setComputeMs(0);
    setCost(ZERO);
    setTiles(0);
    setSettlement(null);
    setBaseline(null);
    setLog([]);
    setError(null);
    setStatus("opening");

    const id = crypto.randomUUID();
    runId.current = id;
    const events = new EventSource(`/api/agent?run=${id}`);
    source.current = events;

    events.addEventListener("started", (event) => setBaseline(JSON.parse(event.data)));
    events.addEventListener("log", (event) => setLog((lines) => [...lines, JSON.parse(event.data)]));

    events.addEventListener("tile", (event) => {
      const tile = JSON.parse(event.data);
      canvas.current?.draw(tile);
      setComputeMs((ms) => ms + tile.computeMs);
      setCost(BigInt(tile.cumulative));
      setTiles(tile.index + 1);
      setStatus((current) => (current === "settling" || tile.index + 1 === tile.total ? "settling" : "rendering"));
    });

    events.addEventListener("settled", (event) => {
      events.close();
      const result: Settlement = JSON.parse(event.data);
      setSettlement(result);
      setCost(BigInt(result.settled));
      // Show the compute time that was actually billed: a tile in flight when Stop was pressed can be
      // charged without arriving. Below one second the minimum charge applies, so the amount no longer maps to time.
      setComputeMs((ms) => (ms >= 1_000 ? Number(result.settled) / RAW_PER_COMPUTE_MS : ms));
      if (!finished.current) setStatus("settled");
      finished.current = true;
      refreshBalances();
      // The explorer and RPC can lag the settlement by a block or two.
      setTimeout(refreshBalances, 4_000);
    });

    // Sent by the agent when the render or the close fails; a settlement may still follow.
    events.addEventListener("failed", (event) => {
      finished.current = true;
      setError(JSON.parse(event.data).message);
      setStatus("failed");
    });

    events.onerror = () => {
      events.close();
      if (finished.current) return;
      finished.current = true;
      setError("Lost the connection to the buyer agent before the render settled.");
      setStatus("failed");
    };
  }

  function stop() {
    setStatus("settling");
    fetch(`/api/agent?run=${runId.current}`, { method: "POST" }).catch(() => {});
  }

  const deposit = Number(DEPOSIT).toFixed(6);
  const refunded = settlement ? formatUsd(BigInt(settlement.deposit) - BigInt(settlement.settled)) : null;

  return (
    <div className={embedded ? "flex w-full flex-col gap-6" : "mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-8"}>
      <header className={embedded ? "hidden" : "flex flex-wrap items-end justify-between gap-4"}>
        <Link href="/" className="flex items-center gap-3.5" title="Back to the overview">
          <Logo className="h-10 w-10 shrink-0" />
          <div>
            <h1 className="text-2xl font-semibold leading-7 tracking-tight text-zinc-50">Rivus</h1>
            <p className="mt-0.5 text-sm text-zinc-400">
              Pay-per-second billing on Tempo. Rent compute, pay for the seconds used, get the rest back.
            </p>
          </div>
        </Link>
        <span className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 font-mono text-xs text-zinc-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Tempo testnet · Moderato
        </span>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex flex-col gap-4">
          <Canvas
            ref={canvas}
            footer={<Lifecycle stage={status} />}
            overlay={
              status === "idle" ? (
                <>
                  <p className="text-base text-zinc-200">Ready to render</p>
                  <p className="max-w-sm text-sm text-zinc-500">
                    {TOTAL_TILES} tiles of real CPU work, each billed for the time it takes. Stop whenever you like.
                  </p>
                </>
              ) : status === "opening" ? (
                <>
                  <p className="animate-pulse text-base text-zinc-200">Opening a payment channel on Tempo…</p>
                  <p className="text-sm text-zinc-500">Locking {deposit} pathUSD in escrow</p>
                </>
              ) : null
            }
          />

          {settlement && refunded && (
            <Receipt
              stopped={settlement.stopped}
              paid={formatUsd(settlement.settled)}
              refunded={refunded}
              computeSeconds={(computeMs / 1000).toFixed(2)}
              txUrl={settlement.txUrl}
            />
          )}

          {error && (
            <section className="rounded-lg border border-red-400/30 bg-red-400/[0.06] p-4 text-sm text-red-200">
              {error}
            </section>
          )}
        </div>

        <aside className="flex flex-col gap-4">
          <Meter
            computeMs={computeMs}
            cost={cost}
            tiles={tiles}
            deposit={RAW_DEPOSIT}
            totalTiles={TOTAL_TILES}
            label={METER_LABELS[status]}
            running={active}
            settled={settlement !== null}
          />

          {status === "rendering" ? (
            <button
              onClick={stop}
              className="h-12 rounded-lg bg-zinc-100 text-sm font-medium text-zinc-900 transition-colors hover:bg-white"
            >
              Stop and refund the rest
            </button>
          ) : (
            <button
              onClick={start}
              disabled={active}
              className="h-12 rounded-lg bg-amber-400 text-sm font-medium text-zinc-950 transition-colors hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-zinc-400"
            >
              {status === "opening"
                ? "Opening payment channel…"
                : status === "settling"
                  ? "Settling on-chain…"
                  : status === "idle"
                    ? "Start render"
                    : "Render again"}
            </button>
          )}

          {/* Both sides of the payment, as their on-chain balances. */}
          <section className="divide-y divide-white/10 rounded-lg border border-white/10 bg-white/[0.03] px-4">
            <ProviderPanel
              title="Buyer"
              party={balances?.agent ?? null}
              explorer={balances?.explorer ?? null}
              liveLabel={refunded ? "Refunded" : "Deposit in escrow"}
              liveValue={refunded ?? (active ? deposit : "—")}
              baseline={baseline?.agent ?? null}
            />
            <ProviderPanel
              title="Provider"
              party={balances?.provider ?? null}
              explorer={balances?.explorer ?? null}
              liveLabel={settlement ? "Settled" : "Vouchers received"}
              liveValue={active || settlement ? formatUsd(cost) : "—"}
              baseline={baseline?.provider ?? null}
            />
          </section>

          <Terminal lines={log} running={active} className="min-h-[200px] grow basis-0" />
        </aside>
      </div>

      {!embedded && <DevSnippet />}
    </div>
  );
}
