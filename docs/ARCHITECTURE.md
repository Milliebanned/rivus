# Architecture — Rivus

## Summary

Rivus is a single Next.js application acting as both the demo provider and the demo buyer's front end, integrating Tempo's `mppx` SDK for all payment logic. There is no custom smart contract in this project — Tempo's Machine Payments Protocol already implements the payment-channel mechanism this product needs (TIP-20 channels, EIP-712 off-chain vouchers, on-chain settlement and refund). The engineering work here is the compute engine and the product experience, not payment-rail plumbing.

## Chain details

- **Network**: Tempo testnet, codename **Moderato**
- **Chain ID**: `42431`
- **RPC**: `https://rpc.moderato.tempo.xyz`
- **Faucet**: `Actions.faucet.fundSync` from `viem/tempo` (used by `npm run setup`); mints test stablecoins including `pathUSD`
- **Explorer**: `https://explore.testnet.tempo.xyz` (exported by viem as `Chain.testnet.blockExplorers`)
- **Payment currency**: `pathUSD` at `0x20c0000000000000000000000000000000000000` (TIP-20, 6 decimals)

`viem/tempo` exports `Chain.testnet` with these values, so the code reads them from there rather than hardcoding.

## Payments

Tempo's MPP toolkit is the `mppx` package (verified against v0.11.0 and the official `examples/session/sse` in `github.com/wevm/mppx`). The API below is what this project actually runs, confirmed end to end on Moderato.

**Server side** (the provider, `lib/provider.ts` + `app/api/render/route.ts`):

```ts
import { Mppx, Store, tempo } from "mppx/server";

const mppx = Mppx.create({
  secretKey,
  methods: [tempo.session({ account, currency: PATH_USD, getClient: () => client, store: Store.memory(), sse: true })],
});

const result = await mppx.session({ amount: "0.01", suggestedDeposit: "1", unitType: "compute-second" })(request);
if (result.status === 402) return result.challenge;                                      // no payment yet
if (request.method !== "GET") return result.withReceipt(new Response(null, { status: 204 })); // channel open / voucher top-up / close
return result.withReceipt(async function* (stream) {
  await stream.charge(cost);   // reserves a raw-unit amount (default: one unit); pauses for a fresh voucher if the balance runs out
  yield chunk;             // sent to the buyer as an SSE event
});
```

One endpoint handles every phase (challenge, channel open, streaming, mid-stream voucher top-ups, close). The `Store` must be shared between the streaming generator and the voucher POSTs, so it's created once per process (cached on `globalThis` to survive dev reloads). The provider's viem client must carry the provider account, because the provider signs the on-chain settle/close.

**Client side** (the buyer/agent, currently `scripts/smoke.mts`):

```ts
import { tempo } from "mppx/client";

const session = tempo.session.manager({ account, client, maxDeposit: "1" });
for await (const chunk of await session.sse(url)) { /* ... */ }   // session.cumulative = amount spent so far
const receipt = await session.close();                              // { channelId, units, acceptedCumulative, txHash }
```

The deposit (`maxDeposit`) is locked in Tempo's escrow when the channel opens. On close, the provider receives the cumulative voucher amount and the rest is refunded to the buyer in the same settlement transaction. The account is a programmatic key (`privateKeyToAccount`), which matches MPP's machine-to-machine design point: it's built for agents and apps to pay automatically, not for a human checkout flow.

**Pricing**: 0.01 pathUSD per compute-second. The renderer times each tile, and the endpoint charges that tile's CPU time pro rata (`stream.charge(amount)` takes a raw token amount). `mppx` charges one unit when the stream opens, so the endpoint treats that first compute-second as credit and draws it down before charging more; it is the minimum charge for a render.

**Verified on testnet**: a full render of 216 tiles took 24.22s of compute and the channel settled on-chain for exactly 0.242215 pathUSD; the agent's balance dropped only by that amount plus gas, with the rest of the 1 pathUSD deposit refunded automatically.

**Next.js integration notes**:
- `mppx` must be listed in `serverExternalPackages` (`next.config.ts`). It lazily imports optional peers (the MCP SDK) that the bundler can't resolve, which otherwise causes a 500 on the route.
- `agentRules: false` is set in `next.config.ts` to stop Next.js 16 from generating agent instruction files into the repo.

**Where the buyer runs**: server-side, in `app/api/agent/route.ts`. The browser opens an `EventSource` to that route; the route creates the buyer's `mppx` session with the agent key, pays the provider's `/api/render` endpoint, and relays each paid tile to the browser along with the running voucher total. Stop is a `POST` to the same route, which aborts the paid stream; the route then closes the channel and sends the browser a final `settled` event with the amount, the deposit, and the explorer link. This keeps keys off the client and keeps the buyer and provider as two separate parties talking over HTTP, even though the demo hosts both. One buyer key means one render at a time; a second request gets a 409.

## Compute engine

A tile-based Mandelbrot fractal renderer (`lib/fractal.ts`), implemented in plain Node. It divides the output image into tiles, computes each tile's pixels using standard escape-time iteration, and yields completed tiles one at a time so the server can charge per unit of work and stream results incrementally. Iteration depth, supersampling and tile size are tuned so a full render takes a controllable ~20-40 seconds of genuine CPU time — long enough to see the meter move meaningfully, short enough to fit a demo video. The current spec (1080x720, 60px tiles, 7x7 samples per pixel, 1000 max iterations, a view of seahorse valley) takes about 24 seconds; `scripts/bench-fractal.mts` measures it. Each tile is computed synchronously and reports its own CPU time; the generator returns to the event loop between tiles so voucher top-ups and close requests are served mid-render. The slowest tile holds the loop for about half a second.

This is real, unsimulated computation: the billing reflects actual CPU time spent, which is the point — it makes the demo provably honest rather than a scripted animation.

## Application structure

```
rivus/
  app/
    page.tsx              — main dashboard: canvas, live meter, controls, dev-integration panel
    api/render/route.ts   — the provider's metered endpoint: wraps the fractal engine in mppx's session middleware
    api/agent/route.ts    — the buyer agent: pays the render endpoint and relays tiles and the settlement to the browser
    api/balances/route.ts — on-chain pathUSD balances of both parties
  lib/
    fractal.ts            — tile-based Mandelbrot compute engine
    tempo.ts              — chain, pathUSD address, env-key loading, viem client helpers
    provider.ts           — the provider's mppx instance and shared channel store
    pricing.ts            — price per compute-second and deposit size, shared by both routes and the page
  scripts/
    setup-wallets.mts     — creates .env.local keys (provider, agent, MPP secret) and funds both wallets from the faucet
    smoke.mts             — command-line buyer agent: opens a channel, streams, closes, prints the settle tx
    bench-fractal.mts     — renders with no payment logic, prints timing, optionally writes a PNG
  components/
    Dashboard.tsx      — page state: run lifecycle, event stream, balances polling
    Canvas.tsx        — progressive tile rendering onto an HTML canvas
    Meter.tsx          — live elapsed-time and accumulating-cost display
    ProviderPanel.tsx  — one party's live voucher/escrow line and on-chain balance; rendered once for the provider and once for the buyer
    DevSnippet.tsx     — displays the actual server-side integration code, to make the drop-in-toolkit framing explicit
  .env.local (gitignored) — PROVIDER_PRIVATE_KEY, AGENT_PRIVATE_KEY, MPP_SECRET_KEY (all testnet-only, generated by `npm run setup`)
```

`app/api/render/route.ts` runs on the Node.js runtime, not the Edge runtime — long-lived Server-Sent Events and stateful voucher handling need it.

## Explicit non-goals

- No custom Solidity contract. Tempo's own protocol provides the payment-channel primitive; writing another one would be redundant and would demonstrate a misunderstanding of the platform, not technical depth.
- No mainnet deployment for the hackathon build — Moderato testnet only.
- No general wallet-connect UX — the client account is a programmatic key, matching MPP's machine-to-machine design point.
