"use client";

import { useState, type CSSProperties } from "react";
import { PRICE_PER_COMPUTE_SECOND } from "@/lib/pricing";

const BOOKED_SECONDS = 100;
const PRICE = Number(PRICE_PER_COMPUTE_SECOND);
const BOOKED_COST = BOOKED_SECONDS * PRICE;

// Drag to choose when the buyer stops a job, and see what each way of billing would charge for it.
export function Calculator() {
  const [seconds, setSeconds] = useState(23);
  const paid = seconds * PRICE;
  const share = (seconds / BOOKED_SECONDS) * 100;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.01] p-6 sm:p-8">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-amber-300">Try it</p>
      <h3 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-50">Drag to stop the job</h3>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-zinc-400">
        A buyer books up to {BOOKED_SECONDS} seconds of compute at the demo price and deposits {BOOKED_COST.toFixed(2)}{" "}
        pathUSD. Choose the moment it stops.
      </p>

      <div className="mt-8">
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-4xl tabular-nums text-zinc-50">
            {seconds}
            <span className="ml-1.5 text-base text-zinc-500">s used</span>
          </span>
          <span className="font-mono text-sm tabular-nums text-zinc-500">of {BOOKED_SECONDS} s booked</span>
        </div>
        <input
          type="range"
          min={1}
          max={BOOKED_SECONDS}
          value={seconds}
          onChange={(event) => setSeconds(Number(event.target.value))}
          aria-label="Seconds of compute used before the buyer stops"
          className="rivus-range mt-4 w-full"
          style={{ "--fill": `${share}%` } as CSSProperties}
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Outcome name="Flat fee or prepaid" paid={BOOKED_COST} back={0} share={100} muted />
        <Outcome name="Rivus, per second" paid={paid} back={BOOKED_COST - paid} share={share} />
      </div>

      <p className="mt-auto pt-6 text-sm text-zinc-400">
        {seconds === BOOKED_SECONDS ? (
          "Use the whole booking and the two cost the same."
        ) : (
          <>
            Billed by the second, the buyer keeps{" "}
            <span className="font-mono tabular-nums text-emerald-300">{(BOOKED_COST - paid).toFixed(2)} pathUSD</span> it
            would otherwise have paid for compute it never used.
          </>
        )}
      </p>
    </div>
  );
}

function Outcome({ name, paid, back, share, muted = false }: { name: string; paid: number; back: number; share: number; muted?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${muted ? "border-white/10 bg-white/[0.02]" : "border-amber-300/30 bg-amber-300/[0.05]"}`}>
      <p className={`text-sm ${muted ? "text-zinc-500" : "text-amber-200"}`}>{name}</p>
      <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-white/[0.06]">
        <div className={`transition-[width] duration-200 ${muted ? "bg-zinc-500" : "bg-amber-400"}`} style={{ width: `${share}%` }} />
        <div className="flex-1 bg-emerald-400/60" />
      </div>
      <dl className="mt-3 flex justify-between font-mono text-sm tabular-nums">
        <div>
          <dt className="font-sans text-xs text-zinc-500">Paid</dt>
          <dd className={muted ? "text-zinc-300" : "text-amber-300"}>{paid.toFixed(2)}</dd>
        </div>
        <div className="text-right">
          <dt className="font-sans text-xs text-zinc-500">Refunded</dt>
          <dd className={back > 0 ? "text-emerald-300" : "text-zinc-600"}>{back.toFixed(2)}</dd>
        </div>
      </dl>
    </div>
  );
}
