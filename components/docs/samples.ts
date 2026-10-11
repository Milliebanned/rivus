// Code samples for the documentation page. They are condensed from the files named beside them on the
// page; when one of those files changes, change its sample here.

export const ENV_SAMPLE = `PROVIDER_PRIVATE_KEY=0x...   # the account that gets paid and signs the on-chain close
AGENT_PRIVATE_KEY=0x...      # the buyer: the account that locks the deposit
RIVUS_SECRET=...             # a random server-side secret; it signs the price quotes the meter issues`;

export const QUICKSTART_SAMPLE = `npm install
npm run setup    # rivus init: writes .env.local with testnet-only keys, funds both wallets from the faucet
npm run dev      # the app, at http://localhost:3000
npm run smoke    # second terminal: rivus pay buys a full render and prints the settlement tx
npm run bench    # renders with no payment logic and prints timing`;

export const INSTALL_SAMPLE = `npm install rivus-meter
npx rivus-meter init      # testnet keys in .env.local, both wallets funded from the faucet`;

export const METER_SAMPLE = `import { createMeter } from "rivus-meter/server";

export const runtime = "nodejs";          // long-lived streams need the Node.js runtime
export const dynamic = "force-dynamic";

const meter = createMeter({
  privateKey: process.env.PROVIDER_PRIVATE_KEY,   // the account that gets paid
  secret: process.env.RIVUS_SECRET,
  price: "0.01",                                  // pathUSD per second of work
  deposit: "1",                                   // what a buyer is asked to lock
});

// Write the work as an async generator. Rivus quotes the price, opens the payment channel, times
// each step, bills it, and settles when either side is done.
export const { GET, POST } = meter.route(async function* (job) {
  for await (const result of doTheWork(job.signal)) {
    yield result;                 // delivered to the buyer, billed for the time it took
  }
});`;

export const HANDLER_SAMPLE = `// Any server that speaks Request and Response: one handler for every method.
const handle = meter.handler(work);       // (request: Request) => Promise<Response>`;

export const MEASURED_SAMPLE = `export const { GET, POST } = meter.route(async function* (job) {
  for await (const tile of renderTiles(undefined, job.signal)) {
    // The renderer times its own CPU work, so bill that figure and not the wall clock.
    yield job.unit(serialize(tile), { seconds: tile.computeMs / 1000 });
  }
});`;

export const NEXT_CONFIG_SAMPLE = `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Load the package from node_modules at runtime instead of bundling it.
  serverExternalPackages: ["rivus-meter"],
};

export default nextConfig;`;

export const BUYER_SAMPLE = `import { createBuyer } from "rivus-meter/client";

const buyer = createBuyer({ privateKey: process.env.AGENT_PRIVATE_KEY });

// Asks the provider for its price, opens the channel and locks the deposit.
const session = await buyer.open("https://provider.example/api/render", {
  maxSpend: "1",        // the most this session can ever cost
  maxPrice: "0.02",     // walk away, before paying, from anything dearer per second
});

for await (const unit of session) {
  use(unit.value);                                   // one paid piece of work
  console.log(unit.seconds, unit.cost, unit.spent);  // what it took, what it cost, the running total
}

const receipt = await session.close();               // settles on-chain, refunds the rest
console.log(receipt.paid, receipt.refunded, receipt.txUrl);`;

export const STOP_SAMPLE = `const session = await buyer.open(url, { maxSpend: "1" });

for await (const unit of session) {
  handle(unit.value);
  if (goodEnough()) break;        // leaving the loop stops the payments
}
// From elsewhere: session.stop(), or pass an AbortSignal as { signal } when opening.

// Always close a session that opened: it settles for the work done and returns the rest.
await session.close();`;

export const TRAFFIC_SAMPLE = `const session = await buyer.open(url, {
  maxSpend: "1",
  onTraffic: (event) => console.log(event.kind, event.text),
});

// out      GET /api/render
// in       402 Payment Required
// note     price 0.01 pathUSD per compute-second
// out      GET /api/render · open channel
// in       200 stream open · channel 0xaf0e…79e7
// voucher  voucher #1 · 0.010156 · 14 ms
// ...
// in       204 settled on Tempo · tx 0x3903…dd22`;

export const CLI_SAMPLE = `npx rivus-meter pay https://provider.example/api/render --max 0.5 --max-price 0.02`;

export const TOOL_SAMPLE = `import { createBuyer } from "rivus-meter/client";

const buyer = createBuyer({ privateKey: process.env.AGENT_PRIVATE_KEY });

// A tool an autonomous agent can call: buy metered work from a URL, never spending more than the budget.
export async function buyMeteredWork(options: {
  url: string;
  budget: string;                         // pathUSD ceiling for this one purchase, e.g. "0.50"
  maxPrice?: string;                      // refuse providers dearer than this per second
  onUnit: (value: unknown) => void;
  signal?: AbortSignal;                   // lets the agent stop paying as soon as it has enough
}) {
  const session = await buyer.open(options.url, {
    maxSpend: options.budget,
    maxPrice: options.maxPrice,
    signal: options.signal,
  });

  try {
    for await (const unit of session) options.onUnit(unit.value);
  } finally {
    // Hand the receipt back to the agent as the tool's result.
    const receipt = await session.close();
    return { paid: receipt.paid, refunded: receipt.refunded, proof: receipt.txUrl };
  }
}`;

export const PROVIDER_PROMPT = `Add pay-per-second billing to an endpoint in this project with the rivus-meter package.

The endpoint to meter: <PATH TO YOUR ROUTE>
Price: <e.g. 0.01> pathUSD per second of work. Suggested deposit: <e.g. 1> pathUSD.

Do the following, in order:
1. Run: npm install rivus-meter
2. Run: npx rivus-meter init
   This writes PROVIDER_PRIVATE_KEY, AGENT_PRIVATE_KEY and RIVUS_SECRET to .env.local and funds
   both testnet wallets. Make sure .env.local is ignored by git.
3. In the route, import createMeter from "rivus-meter/server" and create one meter:
   createMeter({ privateKey: process.env.PROVIDER_PRIVATE_KEY, secret: process.env.RIVUS_SECRET,
   price, deposit }).
4. Rewrite the endpoint's work as an async generator and export it with
   export const { GET, POST } = meter.route(async function* (job) { ... }).
   - Yield each piece of the result as it is ready. Each yielded value is delivered to the
     buyer and billed for the time it took to produce.
   - Pass job.signal into the work so it stops when the buyer leaves.
   - If the work measures its own time, yield job.unit(value, { seconds }) to bill that instead.
5. If this is Next.js: set runtime = "nodejs" and dynamic = "force-dynamic" on the route, and add
   "rivus-meter" to serverExternalPackages in next.config.

Rules:
- Do not write or deploy a smart contract, and do not call the payment protocol directly.
  rivus-meter handles the quote, the channel, the vouchers and the settlement.
- Do not guess the API. Read the type definitions in node_modules/rivus-meter/dist before
  using a function, and stop and tell me if something above does not match them.
- Never commit the keys and never expose them to the browser. Testnet only.

Then prove it works: start the server and run
  npx rivus-meter pay <THE ENDPOINT URL> --max <DEPOSIT>
and show me its output, including the settlement link on the Tempo explorer.`;

export const BUYER_PROMPT = `Make this project able to pay for metered work with the rivus-meter package.

Provider URL: <THE METERED ENDPOINT>
Spending ceiling per session: <e.g. 1> pathUSD
Highest acceptable price: <e.g. 0.02> pathUSD per second

Do the following:
1. Run: npm install rivus-meter
2. Load the buyer's private key from the AGENT_PRIVATE_KEY environment variable, server-side
   only. If there is no key yet, run: npx rivus-meter init
3. Create the buyer with createBuyer({ privateKey }) from "rivus-meter/client".
4. Open a session with buyer.open(url, { maxSpend, maxPrice, signal }) and read it with
   for await (const unit of session). Each unit has value, seconds, cost and spent.
5. Support stopping early: leaving the loop, session.stop() or aborting the signal must all end
   the payments.
6. Always call session.close() for a session that opened, including after an error, and return
   receipt.paid, receipt.refunded and receipt.txUrl to the caller.

Rules:
- Never put the private key in client-side code or in the repository.
- Do not guess the API. Read the type definitions in node_modules/rivus-meter/dist first.
- Handle RivusError: code "price_too_high" means the provider was refused before anything was
  paid; "insufficient_funds" means the wallet holds less than maxSpend.

Then prove it works: run one full session and one that is stopped halfway, and show me that
the wallet's balance changed by the amount paid plus a small network fee in each case.`;
