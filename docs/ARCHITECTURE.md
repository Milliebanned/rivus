# Architecture — Rivus

## Summary

Rivus is two things in one repository. The product is `rivus-meter` (`packages/rivus`), an installable TypeScript package with a provider side (the meter), a buyer side and a command-line tool. The demo is a Next.js application built on that package, acting as both a provider that sells compute and the front end of a buyer agent that pays for it.

There is no custom smart contract. Tempo's Machine Payments Protocol already implements the payment-channel mechanism (TIP-20 channels, EIP-712 off-chain vouchers, on-chain settlement and refund), and `rivus-meter` is built on Tempo's `mppx` SDK for it. What the package adds is everything between a channel and a product: timing the work, turning time into charges, the minimum charge, price limits, spending caps, safe stopping, refunds and a readable account of the exchange.

## Chain details

- **Network**: Tempo testnet, codename **Moderato**
- **Chain ID**: `42431`
- **RPC**: `https://rpc.moderato.tempo.xyz`
- **Faucet**: `Actions.faucet.fundSync` from `viem/tempo` (used by `npm run setup`); mints test stablecoins including `pathUSD`
- **Explorer**: `https://explore.testnet.tempo.xyz` (exported by viem as `Chain.testnet.blockExplorers`)
- **Payment currency**: `pathUSD` at `0x20c0000000000000000000000000000000000000` (TIP-20, 6 decimals)

`viem/tempo` exports `Chain.testnet` with these values, so the code reads them from there rather than hardcoding.

## The package: `rivus-meter`

Source in `packages/rivus/src`, built with `tsc` to `packages/rivus/dist`. The app imports the built output through `tsconfig.json` paths, so the demo consumes the package the way an outside project does. `npm run dev` and `npm run build` build the package first.

**The meter** (`server.ts`, imported as `rivus-meter/server`):

```ts
const meter = createMeter({ privateKey, secret, price: "0.01", deposit: "1", unit: "compute-second" });

export const { GET, POST } = meter.route(async function* (job) {
  for await (const tile of renderTiles(undefined, job.signal)) {
    yield job.unit(serialize(tile), { seconds: tile.computeMs / 1000 });
  }
});
```

- One handler serves every phase of a session: the 402 price quote, the channel open, the paid stream, mid-stream voucher top-ups and the close.
- Each value the generator yields is billed for the time it took. By default the meter clocks the step itself (from asking for the next value until it is ready, so time spent waiting for payment is excluded); `job.unit(value, { seconds })` bills a measurement the work supplies instead. The demo uses the second form, because the renderer times its own CPU work.
- The first second is paid when the stream opens and is drawn down as credit before anything more is charged; it is the minimum charge.
- Payment is collected before delivery: if the buyer's authorised total is short, the charge waits for a fresh voucher.
- One payments instance per provider account is kept for the whole process (on `globalThis`), because the stream and the voucher requests are separate HTTP requests that must see the same open channels, and a dev server re-evaluates modules on reload. Keys are read on the first request, not at import, so a build without them succeeds.
- Each unit goes to the buyer as one server-sent event: `{ value, ms, cost }`.

**The buyer** (`client.ts`, imported as `rivus-meter/client`):

```ts
const buyer = createBuyer({ privateKey });
const session = await buyer.open(url, { maxSpend: "1", maxPrice: "0.02", signal, onTraffic });
for await (const unit of session) { /* unit.value, unit.seconds, unit.cost, unit.spent */ }
const receipt = await session.close();   // { paid, refunded, deposit, txHash, txUrl, channelId, outcome }
```

- Checks the wallet covers `maxSpend` before opening.
- Wraps the `fetch` the payment session uses, so every exchange is read off the real requests and responses and reported through `onTraffic`. The same wrapper reads the price out of the 402 challenge and, when it is above `maxPrice`, refuses before any credential is sent: no channel is opened and nothing is paid.
- The stream only becomes abortable once the channel is open, because cutting the open short could leave a deposit in escrow with no channel on this side to close it. If the provider fails after the channel opened, the buyer closes it before reporting the error.
- Leaving the loop, `session.stop()` or the abort signal all end the payments. The spending cap being reached ends the stream with the outcome `budget` instead of an error.
- `close()` retries once after two seconds, and reports what the close actually moved on-chain (`spent`), which can sit slightly below the highest voucher when a session is stopped mid-unit.

**The command-line tool** (`cli.ts`, the `rivus` binary): `rivus init` writes any missing keys to `.env.local` and funds both wallets from the faucet; `rivus pay <url>` is the buyer as a command, with `--max`, `--max-price` and `--stop-after`; `rivus balance` prints both balances. `npm run setup` and `npm run smoke` run these from source.

**Shared** (`network.ts`, imported as `rivus-meter`): the chain, the pathUSD address, amount parsing and formatting, balance lookup and `RivusError`. Safe to import in the browser.

**Underneath**: `mppx` v0.11.0 (`Mppx.create` with `tempo.session` on the server, `tempo.session.manager` on the client), verified against the SDK's types and its official SSE example. The deposit is locked in Tempo's escrow when the channel opens; on close, the provider receives the amount spent and the rest returns to the buyer in the same settlement transaction.

**Pricing in the demo**: 0.01 pathUSD per compute-second, deposit 1 pathUSD (`lib/pricing.ts`).

**Verified on testnet**: a full render of 216 tiles took 24.22s of compute and the channel settled on-chain for exactly 0.242215 pathUSD; the agent's balance dropped only by that amount plus gas, with the rest of the 1 pathUSD deposit refunded automatically. After the move to the package: full render, stop-early, price refusal (`--max-price 0.005`, nothing paid) and cap reached (`--max 0.03`) all behaved as described; and the packed tarball, installed into an empty project, ran a provider using only `rivus-meter` (clock-timed work at 0.002 pathUSD per second) and paid it with the installed `rivus pay`.

**Next.js integration notes**:
- `mppx` is listed in `serverExternalPackages` (`next.config.ts`). It lazily imports optional peers (the MCP SDK) that the bundler can't resolve, which otherwise causes a 500 on the route. A project that installs `rivus-meter` from npm lists `rivus-meter` there instead.
- The bundler does not resolve the `.js` import specifiers of the package's TypeScript source, which is why the app imports the built output.
- `agentRules: false` is set in `next.config.ts` to stop Next.js 16 from generating agent instruction files into the repo.

**Where the demo's buyer runs**: server-side, in `app/api/agent/route.ts`. The browser opens an `EventSource` to that route; the route opens a Rivus buyer session with the agent key against the provider's `/api/render` endpoint, and relays each paid tile, each traffic line and the running total to the browser. Stop is a `POST` to the same route, which aborts the session; the route then closes it and sends the browser a final `settled` event with the amount, the deposit, and the explorer link. This keeps keys off the client and keeps the buyer and provider as two separate parties talking over HTTP, even though the demo hosts both. One buyer key means one render at a time; a second request is told to try again.

## Compute engine

A tile-based Mandelbrot fractal renderer (`lib/fractal.ts`), implemented in plain Node. It divides the output image into tiles, computes each tile's pixels using standard escape-time iteration, and yields completed tiles one at a time so the server can charge per unit of work and stream results incrementally. Iteration depth, supersampling and tile size are tuned so a full render takes a controllable ~20-40 seconds of genuine CPU time — long enough to see the meter move meaningfully, short enough to fit a demo video. The current spec (1080x720, 60px tiles, 7x7 samples per pixel, 1000 max iterations, a view of seahorse valley) takes about 24 seconds; `scripts/bench-fractal.mts` measures it. Each tile is computed synchronously and reports its own CPU time; the generator returns to the event loop between tiles so voucher top-ups and close requests are served mid-render. The slowest tile holds the loop for about half a second.

This is real, unsimulated computation: the billing reflects actual CPU time spent, which is the point — it makes the demo provably honest rather than a scripted animation.

## Application structure

```
rivus/
  packages/rivus/         — the product: the rivus-meter package
    src/server.ts         — the meter (provider side)
    src/client.ts         — the buyer
    src/cli.ts            — the rivus command: init, pay, balance
    src/network.ts        — chain, token, amounts, balances, errors
    src/types.ts          — shared types: traffic events, units, receipts
  app/
    page.tsx              — landing page
    demo/page.tsx         — the demo on its own
    docs/page.tsx         — the documentation
    api/render/route.ts   — the demo provider's metered endpoint: the fractal engine handed to a Rivus meter
    api/agent/route.ts    — the demo's buyer agent: a Rivus buyer session, relayed to the browser
    api/balances/route.ts — on-chain pathUSD balances of both parties
    api/ledger/route.ts   — what the provider has settled so far, read from the chain
  lib/
    fractal.ts            — tile-based Mandelbrot compute engine
    pricing.ts            — the demo's price per compute-second and deposit size
    ledger.ts             — reads the provider's settlements from the escrow's transfer logs (100k-block queries, paced for the public RPC's rate limit, cached in memory)
  scripts/
    bench-fractal.mts     — renders with no payment logic, prints timing, optionally writes a PNG
  components/
    Dashboard.tsx      — page state: run lifecycle, event stream, balances polling
    Canvas.tsx         — progressive tile rendering onto an HTML canvas
    Meter.tsx          — live elapsed-time and accumulating-cost display
    ProviderPanel.tsx  — one party's live voucher/escrow line and on-chain balance; rendered once for the provider and once for the buyer
    Terminal.tsx       — the agent traffic pane: the buyer's onTraffic events, printed
    DevSnippet.tsx     — displays the provider-side integration code
  .env.local (gitignored) — PROVIDER_PRIVATE_KEY, AGENT_PRIVATE_KEY, RIVUS_SECRET (all testnet-only, generated by `npm run setup`)
```

`app/api/render/route.ts` runs on the Node.js runtime, not the Edge runtime — long-lived Server-Sent Events and stateful voucher handling need it.

## Explicit non-goals

- No custom Solidity contract. Tempo's own protocol provides the payment-channel primitive; writing another one would be redundant and would demonstrate a misunderstanding of the platform, not technical depth.
- No mainnet deployment for the hackathon build — Moderato testnet only.
- No general wallet-connect UX — the client account is a programmatic key, matching MPP's machine-to-machine design point.
