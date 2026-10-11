"use client";

import { useEffect, useState } from "react";
import { Tilt } from "./Tilt";

const COLUMNS = 12;
const ROWS = 8;
const STREAM_MS = 10_000;
const HOLD_MS = 3_500;
const PRICE_PER_SECOND = 0.01;
const DEPOSIT = 1;

// Tiles fill from the centre outwards, like the real renderer.
const ORDER = Array.from({ length: COLUMNS * ROWS }, (_, index) => index).sort((a, b) => distance(a) - distance(b));
const RANK = new Map(ORDER.map((tile, rank) => [tile, rank]));

function distance(index: number): number {
  return Math.hypot((index % COLUMNS) - (COLUMNS - 1) / 2, Math.floor(index / COLUMNS) - (ROWS - 1) / 2);
}

function tileColor(index: number): string {
  const column = index % COLUMNS;
  const row = Math.floor(index / COLUMNS);
  if ((column + row * 3) % 7 === 0) return "hsl(40 92% 58%)";
  return `hsl(${212 + ((column * 7 + row * 13) % 22)} 88% ${24 + ((column * 5 + row * 11) % 38)}%)`;
}

// A looping illustration of one session: ten seconds of metered work, then the settlement.
// It mirrors the live demo further down the page but moves no funds.
export function HeroMeter() {
  const [ms, setMs] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const once = setTimeout(() => setMs(6_400), 0);
      return () => clearTimeout(once);
    }
    const startedAt = performance.now();
    const timer = setInterval(() => setMs((performance.now() - startedAt) % (STREAM_MS + HOLD_MS)), 60);
    return () => clearInterval(timer);
  }, []);

  const settled = ms >= STREAM_MS;
  const seconds = Math.min(ms, STREAM_MS) / 1000;
  const cost = seconds * PRICE_PER_SECOND;
  const filled = Math.floor((seconds * 1000 * COLUMNS * ROWS) / STREAM_MS);

  return (
    <Tilt restX={7} restY={-13} max={7} className="relative mx-auto w-full max-w-[440px] [animation:float_7s_ease-in-out_infinite]">
      <div className="relative rounded-2xl border border-white/10 bg-zinc-950/80 p-5 shadow-[0_40px_120px_-20px_rgba(251,191,36,0.25)] backdrop-blur-xl [transform-style:preserve-3d]">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-zinc-500">
          <span>Session meter</span>
          <span className="flex items-center gap-2">
            <span className={`h-1.5 w-1.5 rounded-full ${settled ? "bg-emerald-400" : "animate-pulse bg-amber-400"}`} />
            {settled ? "Settled" : "Billing"}
          </span>
        </div>

        <div className="mt-4 font-mono text-[40px] leading-none tabular-nums text-amber-300 [transform:translateZ(40px)]">
          {cost.toFixed(6)}
          <span className="ml-2 text-sm text-zinc-500">pathUSD</span>
        </div>

        <div
          className="mt-5 grid gap-[3px] rounded-lg bg-white/[0.03] p-[3px] [transform-style:preserve-3d] [transform:translateZ(24px)]"
          style={{ gridTemplateColumns: `repeat(${COLUMNS}, minmax(0, 1fr))` }}
        >
          {ORDER.map((_, index) => (
            <span
              key={index}
              className="aspect-square rounded-[3px] transition-[transform,background-color] duration-500 ease-out"
              style={
                RANK.get(index)! < filled
                  ? { background: tileColor(index), transform: "translateZ(16px)" }
                  : { background: "rgb(255 255 255 / 0.04)" }
              }
            />
          ))}
        </div>

        <div className="mt-5 flex h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
          <div className="bg-amber-400" style={{ width: `${(cost / DEPOSIT) * 100}%` }} />
          <div className={`flex-1 transition-colors duration-500 ${settled ? "bg-emerald-400/70" : "bg-emerald-400/25"}`} />
        </div>
        <div className="mt-2 flex justify-between font-mono text-xs tabular-nums">
          <span className="text-amber-300">
            <span className="font-sans text-zinc-500">Spent </span>
            {cost.toFixed(6)}
          </span>
          <span className="text-emerald-300">
            <span className="font-sans text-zinc-500">{settled ? "Refunded " : "Refundable "}</span>
            {(DEPOSIT - cost).toFixed(6)}
          </span>
        </div>

        <span className="absolute -right-5 top-16 rounded-full border border-amber-300/30 bg-zinc-950/90 px-3 py-1.5 font-mono text-[11px] text-amber-200 shadow-xl [transform:translateZ(80px)]">
          {seconds.toFixed(1)} s of compute
        </span>
        <span
          className={`absolute -left-6 bottom-20 rounded-full border bg-zinc-950/90 px-3 py-1.5 font-mono text-[11px] shadow-xl transition-colors duration-500 [transform:translateZ(64px)] ${
            settled ? "border-emerald-300/40 text-emerald-200" : "border-white/10 text-zinc-400"
          }`}
        >
          {settled ? "refund sent on close" : "voucher signed off-chain"}
        </span>
      </div>
      <p className="mt-4 text-center text-xs text-zinc-600 [transform:translateZ(0)]">Illustration. The live demo below moves real testnet funds.</p>
    </Tilt>
  );
}
