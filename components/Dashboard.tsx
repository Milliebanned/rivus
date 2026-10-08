"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_SPEC, tileOrder } from "@/lib/fractal";
import { DEPOSIT, PRICE_PER_COMPUTE_SECOND } from "@/lib/pricing";
import { Canvas, type CanvasHandle } from "./Canvas";
import { DevSnippet } from "./DevSnippet";
import { Meter } from "./Meter";
import { ProviderPanel, type Party } from "./ProviderPanel";
import { formatUsd } from "./format";

type Status = "idle" | "opening" | "rendering" | "settling" | "settled" | "failed";
type Balances = { explorer: string; agent: Party; provider: Party };
type Settlement = { settled: string; deposit: string; txUrl: string | null; stopped: boolean };

const TOTAL_TILES = tileOrder(DEFAULT_SPEC).length;
const ZERO = BigInt(0);
const RAW_PER_COMPUTE_MS = Number(PRICE_PER_COMPUTE_SECOND) * 1_000;

export function Dashboard() {
  const canvas = useRef<CanvasHandle>(null);
  const source = useRef<EventSource | null>(null);
  const runId = useRef<string | null>(null);
  // Set once a run has reported its outcome, so the stream ending afterwards isn't treated as a failure.
  const finished = useRef(false);

  const [status, setStatus] = useState<Status>("idle");
  const [computeMs, setComputeMs] = useState(0);
  const [cost, setCost] = useState(ZERO);
  const [tiles, setTiles] = useState(0);
  const [settlement, setSettlement] = useState<Settlement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [balances, setBalances] = useState<Balances | null>(null);

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
    setError(null);
    setStatus("opening");

    const id = crypto.randomUUID();
    runId.current = id;
    const events = new EventSource(`/api/agent?run=${id}`);
    source.current = events;

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
      // A tile in flight when Stop was pressed is billed but never arrives; count its time too.
      // Below one second the minimum charge applies, so the amount no longer maps to time.
      setComputeMs((ms) => (ms >= 1_000 ? Math.max(ms, Number(result.settled) / RAW_PER_COMPUTE_MS) : ms));
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
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Rivus</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Pay-per-second billing on Tempo. Rent compute, pay for the seconds used, get the rest back.
          </p>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 font-mono text-xs text-zinc-400">
          Tempo testnet · Moderato
        </span>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-4">
          <Canvas ref={canvas} />

          {settlement && (
            <section className="rounded-lg border border-emerald-400/30 bg-emerald-400/[0.06] p-4 text-sm">
              <p className="text-zinc-100">
                {settlement.stopped ? "Stopped early." : "Render complete."} Paid{" "}
                <span className="font-mono text-amber-300">{formatUsd(settlement.settled)}</span> pathUSD for{" "}
                <span className="font-mono">{(computeMs / 1000).toFixed(2)}</span> s of compute.{" "}
                <span className="font-mono text-emerald-300">{refunded}</span> pathUSD of the {deposit} deposit was
                refunded.
              </p>
              {settlement.txUrl && (
                <a
                  href={settlement.txUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-emerald-300 underline decoration-emerald-300/40 underline-offset-2 hover:text-emerald-200"
                >
                  View the settlement transaction on the Tempo explorer →
                </a>
              )}
            </section>
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
            totalTiles={TOTAL_TILES}
            running={status === "opening" || status === "rendering"}
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

          <ProviderPanel
            title="Buyer agent"
            party={balances?.agent ?? null}
            explorer={balances?.explorer ?? null}
            liveLabel={refunded ? "Refunded" : "Deposit in escrow"}
            liveValue={refunded ?? (active ? deposit : "—")}
            note="Locks a deposit when the channel opens and signs a voucher for each second of work."
          />
          <ProviderPanel
            title="Provider"
            party={balances?.provider ?? null}
            explorer={balances?.explorer ?? null}
            liveLabel={settlement ? "Settled" : "Vouchers received"}
            liveValue={active || settlement ? formatUsd(cost) : "—"}
            note="Holds signed vouchers during the render and claims them on-chain when the channel closes."
          />
        </aside>
      </div>

      <DevSnippet />
    </div>
  );
}
