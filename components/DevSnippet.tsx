import { highlight } from "./highlight";

// Condensed from app/api/render/route.ts: the whole provider-side integration.
export const PROVIDER_SNIPPET = `import { createMeter } from "rivus-meter/server";

const meter = createMeter({
  privateKey: process.env.PROVIDER_PRIVATE_KEY,   // the account that gets paid
  secret: process.env.RIVUS_SECRET,
  price: "0.01",                                  // pathUSD per second of work
  deposit: "1",                                   // what a buyer is asked to lock
});

// Your work, as an async generator. Rivus quotes the price, opens the payment
// channel, times each step, bills it, and settles when either side is done.
export const { GET, POST } = meter.route(async function* (job) {
  for await (const tile of renderTiles(job.signal)) {
    yield tile;                 // delivered to the buyer, billed for the time it took
  }
});`;

export function DevSnippet() {
  return (
    <details className="group rounded-lg border border-white/10 bg-white/[0.03]">
      <summary className="flex cursor-pointer list-none items-center justify-between p-4 text-sm text-zinc-300">
        <span>
          <span className="text-zinc-100">For developers</span>
          <span className="ml-3 text-zinc-500">Meter your own endpoint with one package</span>
        </span>
        <span className="font-mono text-zinc-500 group-open:hidden">show</span>
        <span className="hidden font-mono text-zinc-500 group-open:inline">hide</span>
      </summary>
      <div className="border-t border-white/10 p-4">
        <p className="mb-3 max-w-2xl text-sm text-zinc-400">
          The fractal is a stand-in. Any compute or API endpoint can be billed the same way: install{" "}
          <code className="font-mono text-zinc-300">rivus-meter</code>, hand the meter your work, and it quotes,
          times, bills and settles on its own. This is the code running behind this page, condensed.
        </p>
        <pre className="overflow-x-auto rounded-md bg-black/40 p-4 font-mono text-xs leading-relaxed text-zinc-300">
          <code>{highlight(PROVIDER_SNIPPET)}</code>
        </pre>
      </div>
    </details>
  );
}
