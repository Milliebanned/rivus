# Rivus

Pay-per-second billing infrastructure for Tempo, demonstrated with a live compute-rental app.

**Live:** https://rivus.milliebanned.xyz · **Package:** [`rivus-meter` on npm](https://www.npmjs.com/package/rivus-meter) · **Docs:** https://rivus.milliebanned.xyz/docs

## What this is

Rivus lets any compute or API provider charge customers by the second — automatically, with an instant refund for whatever isn't used — instead of flat fees or after-the-fact invoices. It's built directly on Tempo's Machine Payments Protocol (MPP), which already provides the underlying payment-channel mechanics (opening a channel, signing off-chain vouchers, settling on-chain, refunding unused balance). Tempo provides the channel; Rivus provides the meter.

The product is the `rivus-meter` package in [`packages/rivus`](packages/rivus):

- **The meter** (`rivus-meter/server`): a provider hands it the work it sells as an async generator. It quotes the price, opens the channel, times each piece of work, collects payment before delivering it, and settles when either side is done.
- **The buyer** (`rivus-meter/client`): pays a metered endpoint under a hard spending cap, refuses a provider whose price is above a limit before any money moves, reports every exchange as it happens, and always takes the refund.
- **The `rivus` command**: `rivus init` creates and funds testnet wallets; `rivus pay <url>` buys metered work from a terminal and prints the settlement.

```ts
import { createMeter } from "rivus-meter/server";

const meter = createMeter({ privateKey, secret, price: "0.01", deposit: "1" });

export const { GET, POST } = meter.route(async function* (job) {
  for await (const result of doTheWork(job.signal)) yield result;   // billed for the time it took
});
```

The demo app in this repository is built on that package, not beside it.

The working demo: a provider rents out compute time to render a fractal image. The renderer does genuine CPU-bound work; the buyer is charged in real time for exactly the seconds of computation used, watches the image fill in live next to a running cost meter, and can stop at any point to get an instant refund of the unused balance.

The fractal is a stand-in task chosen because it's honestly billable and visually clear in a short demo — the real target use case is any provider selling metered compute or API access, and any buyer (increasingly, an autonomous AI agent) that needs to pay for exactly what it consumes without manual billing.

## Why Tempo

Tempo is a payments-first blockchain built for stablecoin settlement at high throughput and low cost. Its MPP toolkit (`mppx`) already implements pay-as-you-go and streamed payment channels (TIP-20, EIP-712 vouchers) — the exact primitive this product needs — so Rivus does not implement its own payment channel or smart contract. `rivus-meter` is built on Tempo's SDK and adds what a provider and a buyer still need on top of a channel: timing the work, turning time into charges, price limits, spending caps, safe stopping and refunds.

## Docs

- [`docs/PRD.md`](docs/PRD.md) — problem, users, features, scope
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — technical design
- [`docs/DESIGN.md`](docs/DESIGN.md) — UX and demo flow
- [`docs/TASKS.md`](docs/TASKS.md) — build checklist
- [`memory.md`](memory.md) — decision log

## Status

Working end to end on Tempo's Moderato testnet: the metered endpoint renders a fractal tile by tile, bills each tile for the CPU time it actually took (0.01 pathUSD per compute-second), and settles on-chain with automatic refund of the unused deposit. A full render is about 24 seconds of compute and costs about 0.24 pathUSD. The landing page at `http://localhost:3000` explains the product and embeds the live demo; `http://localhost:3000/demo` is the demo on its own, and `http://localhost:3000/docs` is the full documentation (also available as `public/rivus-docs.pdf`). The demo shows the render, the live meter, both parties' balances, the buyer agent's live traffic with the provider, and the settlement transaction; stopping mid-render settles for the work done and refunds the rest. The package has also been installed from its tarball into an empty project and run there, as a provider and as a buyer, on testnet. The submission materials and videos are next — see `docs/TASKS.md`.

## Quickstart

```
npm install
npm run setup    # rivus init: creates .env.local with testnet-only keys and funds both wallets from the faucet
npm run dev      # builds the package, then starts the app at http://localhost:3000 — open it, go to the live demo and press Start render
npm run smoke    # in a second terminal: rivus pay buys a full render and prints the settlement tx
                 #   add "-- --stop-after 5" to stop early, or "-- --max-price 0.005" to watch it refuse the price
npm run bench    # renders without any payment logic and prints timing; pass a path to also write a PNG
```

Everything runs on testnet with faucet-issued test tokens. No real funds are involved. See `docs/ARCHITECTURE.md` for chain details.
