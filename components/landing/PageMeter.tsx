"use client";

import { useEffect, useState } from "react";
import { PRICE_PER_COMPUTE_SECOND } from "@/lib/pricing";

const PRICE = Number(PRICE_PER_COMPUTE_SECOND);

// A meter on the visit itself: how long this page has been open and what that time would cost at the
// demo price. It charges nothing; it is there to make per-second billing something you can feel.
export function PageMeter() {
  const [seconds, setSeconds] = useState<number | null>(null);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    const startedAt = performance.now();
    const timer = setInterval(() => setSeconds((performance.now() - startedAt) / 1000), 100);
    return () => clearInterval(timer);
  }, []);

  if (closed || seconds === null) return null;

  const whole = Math.floor(seconds);
  const clock = `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;

  return (
    <aside className="fixed bottom-5 left-5 z-40 hidden items-center gap-3 rounded-full border border-white/10 bg-zinc-950/80 py-2 pl-4 pr-2 text-xs text-zinc-400 shadow-2xl backdrop-blur-xl [animation:fade-up_0.6s_ease-out_both] md:flex">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
      <span>
        If this visit were metered: <span className="font-mono tabular-nums text-zinc-200">{clock}</span>
        <span className="mx-2 text-zinc-700">·</span>
        <span className="font-mono tabular-nums text-amber-300">{(seconds * PRICE).toFixed(4)}</span> pathUSD
      </span>
      <button
        onClick={() => setClosed(true)}
        aria-label="Hide the page meter"
        className="flex h-6 w-6 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-white/10 hover:text-zinc-200"
      >
        ✕
      </button>
    </aside>
  );
}
