export type Stage = "idle" | "opening" | "rendering" | "settling" | "settled" | "failed";

const STEPS = [
  { label: "Open channel", detail: "deposit locked in escrow" },
  { label: "Stream vouchers", detail: "signed off-chain, per tile" },
  { label: "Settle on-chain", detail: "one transaction" },
  { label: "Refund the rest", detail: "back to the buyer" },
];

// How many steps are finished at each stage; the next one is in progress unless the run is over.
const DONE: Record<Stage, number> = { idle: 0, opening: 0, rendering: 1, settling: 2, settled: 4, failed: 0 };

// The life of one payment channel, so a viewer can see where in it the render is.
export function Lifecycle({ stage }: { stage: Stage }) {
  const done = DONE[stage];
  const current = stage === "opening" || stage === "rendering" || stage === "settling" ? done : -1;

  return (
    <ol className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-white/10 px-4 py-3 sm:grid-cols-4">
      {STEPS.map((step, index) => {
        const state = index < done ? "done" : index === current ? "current" : "pending";
        return (
          <li key={step.label} className="flex items-start gap-2.5">
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[11px] ${
                state === "done"
                  ? "bg-emerald-400/15 text-emerald-300"
                  : state === "current"
                    ? "animate-pulse bg-amber-400 text-zinc-950"
                    : "border border-white/15 text-zinc-500"
              }`}
            >
              {state === "done" ? "✓" : index + 1}
            </span>
            <span className="min-w-0">
              <span className={`block text-sm ${state === "pending" ? "text-zinc-500" : "text-zinc-100"}`}>
                {step.label}
              </span>
              <span className="block text-xs text-zinc-500">{step.detail}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
