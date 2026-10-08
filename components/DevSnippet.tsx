// Condensed from app/api/render/route.ts: the whole provider-side integration.
const SNIPPET = `import { Mppx, Store, tempo } from "mppx/server";

const mppx = Mppx.create({
  secretKey,
  methods: [tempo.session({ account, currency: PATH_USD, store: Store.memory(), sse: true })],
});

export async function GET(request: Request) {
  const result = await mppx.session({
    amount: "0.01",              // price per unit
    unitType: "compute-second",
    suggestedDeposit: "1",
  })(request);

  if (result.status === 402) return result.challenge;   // no payment yet: ask for one

  return result.withReceipt(async function* (stream) {
    for await (const tile of renderTiles()) {            // your metered work goes here
      await stream.charge(priceFor(tile.computeMs));     // bill exactly the time it took
      yield serialize(tile);                             // deliver the result
    }
  });
}`;

export function DevSnippet() {
  return (
    <details className="group rounded-lg border border-white/10 bg-white/[0.03]">
      <summary className="flex cursor-pointer list-none items-center justify-between p-4 text-sm text-zinc-300">
        <span>
          <span className="text-zinc-100">For developers</span>
          <span className="ml-3 text-zinc-500">Meter your own endpoint in about 20 lines</span>
        </span>
        <span className="font-mono text-zinc-500 group-open:hidden">show</span>
        <span className="hidden font-mono text-zinc-500 group-open:inline">hide</span>
      </summary>
      <div className="border-t border-white/10 p-4">
        <p className="mb-3 max-w-2xl text-sm text-zinc-400">
          The fractal is a stand-in. Any compute or API endpoint can be billed the same way: wrap the handler in a
          session, charge as the work happens, and the channel settles and refunds on its own. This is the code
          running behind this page, condensed.
        </p>
        <pre className="overflow-x-auto rounded-md bg-black/40 p-4 font-mono text-xs leading-relaxed text-zinc-300">
          <code>{SNIPPET}</code>
        </pre>
      </div>
    </details>
  );
}
